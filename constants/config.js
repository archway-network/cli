const { spawn } = require("child_process");
const DefaultFilename = 'config.json';

async function getConfig() {
  let configPath = await getConfigPath();
  let config = require(configPath);
  return config;
}

async function getConfigPath() {
  const source = spawn('git', ['rev-parse','--show-toplevel'], { stdio: ['inherit','pipe','inherit'] });

  for await (const data of source.stdout) {
    let topLevel = Buffer.from(data).toString().trim();
    return topLevel + '/' + DefaultFilename;
  }
}

module.exports = {
  config: getConfig,
  path: getConfigPath
};