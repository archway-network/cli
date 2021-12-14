const { spawn } = require("child_process");
const path = require('path');

const ConfigFilename = 'config.json';

async function getConfig() {
  let configPath = await getConfigPath();
  let config = require(configPath);
  return config;
}

async function getConfigPath() {
  const source = spawn('cargo', ['locate-project', '--message-format', 'plain'], { stdio: ['inherit', 'pipe', 'inherit'] });

  for await (const data of source.stdout) {
    const cargoFilePath = Buffer.from(data).toString().trim();
    return path.join(path.dirname(cargoFilePath), ConfigFilename);
  }
}

module.exports = {
  config: getConfig,
  path: getConfigPath
};
