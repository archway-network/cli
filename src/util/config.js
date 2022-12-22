const _ = require('lodash');
const path = require('path');
const { writeFile } = require('fs/promises');
const { loadNetworkConfig } = require('../networks');
const Cargo = require('../clients/cargo');

const ConfigFilename = 'config.json';

/**
 * @deprecated since v1.2.0
 */
async function getConfigPath(pathPrefix) {
  const rootPath = pathPrefix || await new Cargo().locateProject();
  return path.join(rootPath, ConfigFilename);
}

/**
 * @deprecated since v1.2.0
 */
async function writeConfig(config, pathPrefix) {
  const configPath = await getConfigPath(pathPrefix);
  const json = JSON.stringify(config, null, 2);
  await writeFile(configPath, json);
}

/**
 * @deprecated since v1.2.0
 */
async function readConfig(pathPrefix) {
  try {
    const configPath = await getConfigPath(pathPrefix);
    return require(configPath);
  } catch (e) {
    throw new Error(`Failed to open the project config file: make sure you are running the command from an Archway project directory`);
  }
}

function mergeCustomizer({ arrayMode = 'overwrite' } = {}) {
  return _.cond([
    [_.overEvery(_.isArray, _.constant(arrayMode === 'overwrite')), _.identity],
    [_.overEvery(_.isArray, _.constant(arrayMode === 'append')), _.concat],
    [_.overEvery(_.isArray, _.constant(arrayMode === 'prepend')), (objValue = [], srcValue = []) => [...srcValue, ...objValue]],
  ]);
}

/**
 * @deprecated since v1.2.0
 */
async function updateConfig(newSettings = {}, mergeOptions = {}, pathPrefix) {
  const config = await readConfig(pathPrefix);
  await writeConfig(_.mergeWith(config, newSettings, mergeCustomizer(mergeOptions)), pathPrefix);
}

class Config {
  #data;
  #path;
  #deployments;

  constructor(data = {}, path) {
    this.#data = data;
    this.#path = path;
    this.#deployments = new Deployments(this);
  }

  get data() {
    return this.#data;
  }

  get path() {
    return this.#path;
  }

  get projectRootDir() {
    return path.dirname(this.path);
  }

  get deployments() {
    return this.#deployments;
  }

  get(path, defaultValue = undefined) {
    return _.get(this.data, path, defaultValue);
  }

  async write() {
    const json = JSON.stringify(this.data, null, 2);
    await writeFile(this.path, json);
  }

  async update(newSettings = {}, mergeOptions = {}) {
    _.mergeWith(this.data, newSettings, mergeCustomizer(mergeOptions));
    await this.write();
  }

  static async init(name, { docker = false, environment, testnet, ...extraData } = {}, projectRootDir) {
    try {
      const projectConfig = {
        name: name,
        developer: {
          archwayd: { docker }
        }
      };
      const networkConfig = loadNetworkConfig(environment, testnet);
      const configData = _.defaultsDeep(extraData, projectConfig, networkConfig);
      const configPath = await Config.#findConfigPath(projectRootDir);

      return new Config(configData, configPath);
    } catch (e) {
      throw new Error(`Failed to initialize the project config file: make sure you are running the command from a CosmWasm project directory`);
    }
  }

  static async open(projectRootDir) {
    try {
      const configPath = await Config.#findConfigPath(projectRootDir);
      const configData = require(configPath);

      return new Config(configData, configPath);
    } catch (e) {
      throw new Error(`Failed to open the project config file: make sure you are running the command from an Archway project directory`);
    }
  }

  static async #findConfigPath(projectRootDir) {
    projectRootDir ||= await Config.#getWorkspaceRoot();
    return path.join(projectRootDir, ConfigFilename);
  }

  static async #getWorkspaceRoot() {
    const cargo = new Cargo();
    const { workspaceRoot } = await cargo.projectMetadata();
    return workspaceRoot;
  }
}

class Deployments {
  #config;

  constructor(config) {
    this.#config = config;
  }

  get config() {
    return this.#config;
  }

  static #isValidDeployment = _.conforms({
    type: _.isString,
    chainId: _.isString,
    txhash: _.isString,
    codeId: _.isNumber,
  });

  async add(deployment = {}) {
    if (!Deployments.#isValidDeployment(deployment)) {
      throw new Error(`Could not save deployment data to config file`);
    }

    await this.config.update(
      { developer: { deployments: [deployment] } },
      { arrayMode: 'prepend' }
    );
  }

  list() {
    return this.config.get('developer.deployments', []);
  }

  listByChainId(chainId) {
    chainId ||= this.config.get('network.chainId');
    return this.list()
      .filter(_.matches({ chainId }));
  }

  findLastByTypeAndChainId(type, chainId) {
    return this.list()
      .find(_.matches({ type, chainId }));
  }
}

module.exports = {
  ConfigFilename,
  Config,
  read: readConfig,
  write: writeConfig,
  update: updateConfig,
  path: getConfigPath,
};
