const _ = require('lodash');
const { isArchwayAddress } = require('../../util/validators');

class KeysCommands {
  #client;
  #getAddressCache;

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
    if (!_.isFunction(this.#getAddressCache)) {
      this.#getAddressCache = _.memoize(async (name) => {
        const archwayd = this.#client.run('keys', ['show', name, '-a'], { stdio: ['inherit', 'pipe', 'inherit'] });
        archwayd.stdout.pipe(process.stdout);
        const { stdout } = await archwayd;
        const lines = stdout.replace(/\r/g, '').split('\n');
        return lines.find(isArchwayAddress);
      });
    }

    return await this.#getAddressCache(name);
  }
}

module.exports = KeysCommands;
