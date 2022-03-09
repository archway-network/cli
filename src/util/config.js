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
    throw new Error(`Failed to open the project config file: make sure you are running the command from an Archway project directory`);
  }
}

function mergeCustomizer({ arrayMode = 'append' } = {}) {
  return _.cond([
    [_.overEvery(_.isArray, _.constant(arrayMode === 'append')), _.concat],
    [_.overEvery(_.isArray, _.constant(arrayMode === 'prepend')), (objValue, srcValue) => [...srcValue, ...objValue]],
  ]);
}

async function updateConfig(newSettings = {}, mergeOptions = {}) {
  const config = await readConfig();
  await writeConfig(_.mergeWith(config, newSettings, mergeCustomizer(mergeOptions)));
}

module.exports = {
  ConfigFilename,
  read: readConfig,
  write: writeConfig,
  update: updateConfig,
  path: getConfigPath
};
