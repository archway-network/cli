const { spawnSync } = require("child_process");
const path = require('path');

const ConfigFilename = 'config.json';

function getConfig() {
  let configPath = getConfigPath();
  let config = require(configPath);
  return config;
}

function getConfigPath() {
  const cargo = spawnSync(
    'cargo',
    ['locate-project', '--message-format', 'plain'],
    { stdio: ['inherit', 'pipe', 'pipe'] }
  );

  let cargoFilePath = (cargo.stdout) ? cargo.stdout.toString() : undefined;
  return path.join(path.dirname(cargoFilePath), ConfigFilename);
}

module.exports = {
  config: getConfig,
  path: getConfigPath
};
