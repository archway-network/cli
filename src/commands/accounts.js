const chalk = require('chalk');

class Accounts {
  constructor(client) {
    this.client = client;
  }

  async add(name) {
    await this.client.run('keys', ['add', name]);
  }

  async list() {
    console.info('Printing list of active accounts...');
    await this.client.run('keys', ['list']);
  }
}

async function main(client, { add: name } = {}) {
  const accounts = new Accounts(client);
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
