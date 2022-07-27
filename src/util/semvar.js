const { spawn } = require('child_process');
const chalk = require('chalk');

function getVersion() {
  const { version } = require('../../package.json');
  return version;
}

async function checkSemanticVersion() {
  console.info('Checking for updates...');
  const version = getVersion();

  let runScript = {
    cmd: 'npm',
    params: ['view', '@archwayhq/cli', 'version']
  };

  const source = await spawn(runScript.cmd, runScript.params);
  source.stdout.setEncoding('utf8');
  source.stdout.on('data', remote => {
    remote = remote.trim();
    if (remote !== version) {
      console.warn(chalk`{whiteBright A newer version of Archway CLI is available ({green.bold v${remote}})\nSupport for {green.bold v${version}} has ended. Install the latest version with {yellow.bold npm install -g @archwayhq/cli}}`);
      console.info('If you want skip this check, add ARCHWAY_SKIP_VERSION_CHECK=true to your environment file (.bashrc, .zshrc, ...)');
    }
  });
}

module.exports = { checkSemanticVersion };
