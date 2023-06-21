const debug = require('debug')('config');

const _ = require('lodash');
const path = require('node:path');
const fs = require('node:fs/promises');
const { loadNetworkConfig } = require('../networks');
const Cargo = require('../clients/cargo');

const ConfigFilename = 'config.json';

class ConfigError extends Error {
  constructor(message, cause) {
    super(message);
    this.cause = cause;
  }

  get message() {
    return `${super.message}: ${this.cause?.message}`;
  }
}

class ConfigFileNotFoundError extends ConfigError { }
class ConfigOpenError extends ConfigError { }
class ConfigInitError extends ConfigError { }
class InvalidConfigError extends ConfigError { }
class InvalidDeploymentConfigError extends InvalidConfigError { }

/**
 * Manages the Archway project configuration file.
 *
 * @typedef {{
 * name: string,
 * developer: { docker: boolean },
 * network: {
 *  name: string,
 *  chainId: string,
 *  type: string,
 *  fees: { feeDenom: string },
 *  gas: { prices: string, mode: string, adjustment: string } }
 *  urls: {
 *    rpc: { url: string, port: number }
 *  },
 * }} ConfigData
 */
class Config {
  #data;
  #path;
  #deployments;

  /**
   *
   * @param {ConfigData} data
   * @param {fs.PathLike} path
   */
  constructor(data = {}, path) {
    Config.validate(data);

    this.#data = data;
    this.#path = path;
    this.#deployments = new Deployments(this);
  }

  /**
   * @type {ConfigData}
   */
  get data() {
    return this.#data;
  }

  get path() {
    return this.#path;
  }

  get projectRootDir() {
    return path.dirname(this.path);
  }

  /**
   * @type {Deployments}
   */
  get deployments() {
    return this.#deployments;
  }

  get(path, defaultValue = undefined) {
    return _.get(this.data, path, defaultValue);
  }

  static #isValidConfig = _.conforms({
    name: _.isString,
    developer: _.conforms({
      archwayd: _.conforms({ docker: _.isBoolean })
    }),
    network: _.conforms({
      name: _.isString,
      chainId: _.isString,
      type: _.isString,
      fees: _.conforms({ feeDenom: _.isString }),
      gas: _.conforms({
        prices: _.isString,
        mode: _.isString,
        adjustment: _.isString
      }),
      urls: _.conforms({
        rpc: _.conforms({ url: _.isString, port: _.isNumber })
      }),
    }),
  });

  /**
   * Validates the current config data and throws an error if it is invalid.
   *
   * @throws {InvalidConfigError}
   */
  static validate(data) {
    if (!Config.#isValidConfig(data)) {
      throw new InvalidConfigError('The config data seems invalid');
    }
  }

  /**
   * Writes the current config data to the config file.
   */
  async write() {
    debug('writing config file to %s', this.path);
    Config.validate(this.data);
    const json = JSON.stringify(this.data, null, 2);
    await fs.writeFile(this.path, json);
  }

  /**
   * Updates the config file with the given data and writes it to disk.
   *
   * @param {ConfigData} newData
   * @param {*} mergeOptions
   */
  async update(newData = {}, mergeOptions = {}) {
    debug('updating config with %s', JSON.stringify(newData));
    _.mergeWith(this.data, newData, mergeCustomizer(mergeOptions));
    await this.write();
  }

  /**
   * Initializes a new config file and returns a Config instance.
   *
   * @param {fs.PathLike} workspaceRoot
   * @returns {Promise<Config>}
   * @throws {ConfigInitError}
   */
  static async init(name, { docker = false, environment, testnet, ...extraData } = {}, workspaceRoot) {
    try {
      const projectConfig = {
        name: name,
        developer: {
          archwayd: { docker },
          deployments: []
        }
      };
      const networkConfig = loadNetworkConfig(environment, testnet);
      const configData = _.defaultsDeep(extraData, projectConfig, networkConfig);
      const configPath = await Config.#getConfigFilePath(workspaceRoot);
      debug('initializing config file at %s', configPath);

      return new Config(configData, configPath);
    } catch (e) {
      throw new ConfigInitError('Failed to initialize the project config file: make sure you are running the command from a CosmWasm project directory', e);
    }
  }

  /**
   * Opens the config file and returns a Config instance.
   *
   * @param {fs.PathLike} workspaceRoot
   * @returns {Promise<Config>}
   * @throws {ConfigOpenError}
   */
  static async open(workspaceRoot) {
    try {
      const configPath = await Config.#getConfigFilePath(workspaceRoot);
      debug('opening config file at %s', configPath);
      await fs.access(configPath).catch(e => { throw new ConfigFileNotFoundError(configPath, e); });
      const configData = require(configPath);

      return new Config(configData, configPath);
    } catch (e) {
      throw new ConfigOpenError('Failed to open the project config file: make sure you are running the command from an Archway project directory', e);
    }
  }

  /**
   * Reads the config file and returns the JSON data.
   *
   * @param {fs.PathLike} workspaceRoot
   * @returns {Promise<ConfigData>}
   * @throws {ConfigOpenError}
   */
  static async read(workspaceRoot) {
    const config = await Config.open(workspaceRoot);
    return config.data;
  }

  static async #getConfigFilePath(workspaceRoot) {
    workspaceRoot ||= await getWorkspaceRoot();
    return path.join(workspaceRoot, ConfigFilename);
  }
}

class Deployments {
  #config;

  /**
   * @param {Config} config
   */
  constructor(config) {
    this.#config = config;
  }

  /**
   * @type {Config}
   */
  get config() {
    return this.#config;
  }

  static #isValidDeployment = _.conforms({
    project: _.isString,
    type: _.isString,
    chainId: _.isString,
    txhash: _.isString,
    codeId: _.isNumber,
  });

  async add(deployment = {}) {
    if (!Deployments.#isValidDeployment(deployment)) {
      throw new InvalidDeploymentConfigError('Could not save deployment data to config file');
    }

    await this.config.update(
      { developer: { deployments: [deployment] } },
      { arrayMode: 'prepend' }
    );
  }

  list() {
    return this.config.get('developer.deployments', [])
      .map(deployment => _.defaults(deployment, { project: this.config.get('name') }));
  }

  listBy(fields) {
    return this.list()
      .filter(_.matches(fields));
  }

  listByChainId(chainId) {
    chainId ||= this.config.get('network.chainId');
    return this.listBy({ chainId });
  }

  findLastBy(fields) {
    return this.list()
      .find(_.matches(fields));
  }

  findLastByTypeAndProjectAndChainId(type, project, chainId) {
    project ||= this.config.get('name');
    chainId ||= this.config.get('network.chainId');
    return this.findLastBy({ type, project, chainId });
  }
}

function mergeCustomizer({ arrayMode = 'overwrite' } = {}) {
  return _.cond([
    [_.overEvery(_.isArray, _.constant(arrayMode === 'overwrite')), _.nthArg(1)],
    [_.overEvery(_.isArray, _.constant(arrayMode === 'append')), _.concat],
    [_.overEvery(_.isArray, _.constant(arrayMode === 'prepend')), (objValue = [], srcValue = []) => [...srcValue, ...objValue]],
  ]);
}

async function getWorkspaceRoot() {
  const cargo = new Cargo();
  const { workspaceRoot } = await cargo.projectMetadata();
  return workspaceRoot;
}

module.exports = {
  Config,
  ConfigFilename,
  ConfigError,
  ConfigFileNotFoundError,
  ConfigOpenError,
  ConfigInitError,
  InvalidConfigError,
  InvalidDeploymentConfigError,
};
