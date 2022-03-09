const { isArchwayAddress } = require('../../util/validators');

class KeysCommands {
  #client;

  constructor(client) {
    this.#client = client;
  }

  async add(name) {
    await this.#client.run('keys', ['add', name]);
  }

  async list() {
    await this.#client.run('keys', ['list']);
  }

  async getAddress(name) {
    const archwayd = this.#client.run('keys', ['show', name, '-a'], { stdio: ['inherit', 'pipe', 'inherit'] });
    archwayd.stdout.pipe(process.stdout);
    const { stdout } = await archwayd;
    const lines = stdout.replace(/\r/g, '').split('\n');
    return lines.find(isArchwayAddress);
  }
}

module.exports = KeysCommands;
