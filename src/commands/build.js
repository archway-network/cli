// archway-cli/util/build.js

const chalk = require('chalk');
const ScriptRunner = require('../util/scripts');

async function main() {
  try {
    console.info(`Building project...\n`);
    await new ScriptRunner().run('build');
  } catch (e) {
    console.error(chalk`{red {bold Build failed}\n${e.message || e}}`);
  }
}

module.exports = main;
