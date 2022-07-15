class QueryCommands {
  #client;

  constructor(client) {
    this.#client = client;
  }

  async tx(txhash, options) {
    return await this.#runJson(['tx', txhash], options);
  }

  async txEventAttribute(txhash, eventType, attributeKey, options) {
    const transaction = await this.tx(txhash, options);

    const { logs: [{ events = [] } = {}] = [] } = transaction;
    const { attributes = [] } = events.find(event => event.type === eventType) || {};
    const { value } = attributes.find(attribute => attribute.key === attributeKey) || {};

    return value;
  }

  async wasmCode(codeId, outputFilePath, options) {
    return await this.#run(['wasm', 'code', codeId, outputFilePath], options);
  }

  async smartContract(module, type, contract, args, options) {
    return await this.#run(['wasm', module, type, contract, args], options);
  }

  async #run(queryArgs = [], { node, flags = [], printStdout } = {}) {
    const args = [
      ...queryArgs,
      '--node', node,
      ...flags
    ];
    const { stdout } = await this.#client.run('query', args, { stdio: ['inherit', 'pipe', 'inherit'], printStdout });
    return stdout;
  }

  async #runJson(queryArgs = [], { node, flags = [], printStdout } = {}) {
    const args = [
      ...queryArgs,
      '--node', node,
      ...flags
    ];
    return await this.#client.runJson('query', args, { stdio: ['inherit', 'pipe', 'inherit'], printStdout });
  }
}

module.exports = QueryCommands;
