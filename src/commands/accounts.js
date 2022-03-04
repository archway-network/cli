const chalk = require('chalk');

async function main(archwayd, { add: name } = {}) {
  try {
    if (name) {
      await archwayd.keys.add(name);
    } else {
      console.info('Printing list of active accounts...');
      await archwayd.keys.list();
    }
  } catch (e) {
    console.error(chalk`\n{red.bold ${e.message || e}}`);
  }
}

module.exports = Object.assign(main);
