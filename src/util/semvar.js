const semver = require('semver');
const { spawn } = require('promisify-child-process');
const chalk = require('chalk');

async function checkSemanticVersion() {
  console.info('Checking for updates...');
  const { version, name } = require('../../package.json');

  const { stdout } = await spawn('npm', ['view', name, 'version'], { encoding: 'utf8', stdio: 'pipe' });
  const lines = stdout.replace(/\r/g, '').split('\n');
  const remote = lines.find(semver.valid);

  if (semver.gt(remote, version)) {
    console.warn(chalk`{whiteBright A newer version of Archway CLI is available ({green.bold v${remote}})\nSupport for {green.bold v${version}} has ended. Install the latest version with {yellow.bold npm install -g @archwayhq/cli}}`);
    console.info('If you want skip this check, prepend the command with ARCHWAY_SKIP_VERSION_CHECK=true, or add it to your environment file (.bashrc, .zshrc, ...)');
  }
}

module.exports = { checkSemanticVersion };
