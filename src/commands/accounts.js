const chalk = require('chalk');

class Accounts {
  constructor(archwayd) {
    this.archwayd = archwayd;
  }

  async add(name) {
    await this.archwayd.run('keys', ['add', name]);
  }

  async list() {
    console.info('Printing list of active accounts...');
    await this.archwayd.run('keys', ['list']);
  }
}

async function main(archwayd, { add: name } = {}) {
  const accounts = new Accounts(archwayd);
  try {
    if (name) {
      await accounts.add(name);
    } else {
      await accounts.list();
    }
  } catch (e) {
    console.error(chalk`\n{red.bold ${e.message || e}}`);
  }
}

module.exports = Object.assign(main, { Accounts });
