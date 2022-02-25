const _ = require('lodash');
const path = require('path');
const { writeFile } = require('fs/promises');
const { spawn } = require('promisify-child-process');

const ConfigFilename = 'config.json';

async function findConfigRootPath() {
  const { stdout } = await spawn(
    'cargo',
    ['locate-project', '--message-format', 'plain'],
    { stdio: ['inherit', 'pipe', 'pipe'], encoding: 'utf8' }
  );

  const cargoFilePath = stdout ? stdout.toString() : undefined;
  return path.dirname(cargoFilePath);
}

async function getConfigPath(pathPrefix = null) {
  const rootPath = pathPrefix || await findConfigRootPath();
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

async function updateConfig(newSettings = {}) {
  const config = await readConfig();
  await writeConfig(_.defaultsDeep(config, newSettings));
}

module.exports = {
  ConfigFilename,
  read: readConfig,
  write: writeConfig,
  update: updateConfig,
  path: getConfigPath
};
