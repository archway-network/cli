// archway-cli/util/test.js

const chalk = require('chalk');
const ScriptRunner = require('../util/scripts');

async function main() {
  try {
    console.info(`Running tests...\n`);
    await new ScriptRunner().run('test');
  } catch (e) {
    console.error(chalk`{red {bold Failed to run tests}\n${e.message || e}}`);
  }
}

module.exports = main;
