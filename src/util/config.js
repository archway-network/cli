const _ = require('lodash');
const path = require('path');
const { writeFile } = require('fs/promises');
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

  static async open(rootPath) {
    try {
      rootPath = rootPath || await new Cargo().locateProject();
      const configPath = path.join(rootPath, ConfigFilename);
      const configData = require(configPath);
      return new Config(configData, configPath);
    } catch (e) {
      throw new Error(`Failed to open the project config file: make sure you are running the command from an Archway project directory`);
    }
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
    chainId = chainId || this.config.get('network.chainId');
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
