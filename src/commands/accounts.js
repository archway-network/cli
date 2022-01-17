class Accounts {
  constructor(client, options) {
    this.client = client;
    this.options = options;
  }

  async add(name = null) {
    const archwayd = await this.client.runInherited('keys', 'add', name);
    archwayd.on('error', (err) => {
      console.error(`Error adding wallet ${name} to keychain`, err);
    });
  }

  async list() {
    console.log('Printing list of active accounts...\n');
    const archwayd = await this.client.runInherited('keys', 'list');
    archwayd.on('error', (err) => {
      console.error('Error listing keys', err);
    });
  }
}

async function main(client, { add, ...options }) {
  const accounts = new Accounts(client, options);
  if (add !== undefined) {
    await accounts.add(add);
  } else {
    await accounts.list();
  }
}

module.exports = main;
