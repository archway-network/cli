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
}

module.exports = KeysCommands;
