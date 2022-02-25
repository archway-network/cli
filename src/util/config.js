const _ = require('lodash');
const path = require('path');
const { writeFile } = require('fs/promises');
const Cargo = require('../clients/cargo');

const ConfigFilename = 'config.json';

async function getConfigPath(pathPrefix = null) {
  const rootPath = pathPrefix || await new Cargo().locateProject();
  return path.join(rootPath, ConfigFilename);
}

async function writeConfig(config, pathPrefix = null) {
  const configPath = await getConfigPath(pathPrefix);
  const json = JSON.stringify(config, null, 2);
  await writeFile(configPath, json);
}

async function readConfig(pathPrefix = null) {
  try {
    const configPath = await getConfigPath(pathPrefix);
    return require(configPath);
  } catch (e) {
    throw new Error(`Failed to open the project config file ${ConfigFilename}: ${e.message || e}`);
  }
}

function customizer(objValue, srcValue) {
  if (_.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

async function updateConfig(newSettings = {}) {
  const config = await readConfig();
  await writeConfig(_.mergeWith(config, newSettings, customizer));
}

module.exports = {
  ConfigFilename,
  read: readConfig,
  write: writeConfig,
  update: updateConfig,
  path: getConfigPath
};
