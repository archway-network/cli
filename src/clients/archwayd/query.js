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
    return QueryCommands.getTxEventAttribute(transaction, eventType, attributeKey);
  }

  static getTxEventAttribute(transaction, eventType, attributeKey) {
    const { logs: [{ events = [] } = {}] = [] } = transaction;
    const { attributes = [] } = events.find(event => event.type === eventType) || {};
    const { value } = attributes.find(attribute => attribute.key === attributeKey) || {};

    return value;
  }

  async wasmCode(codeId, outputFilePath, options) {
    return await this.#run(['wasm', 'code', codeId, outputFilePath], options);
  }

  async smartContract(module, type, contract, args, options) {
    return await this.#runJson(['wasm', module, type, contract, args], options);
  }

  async rewardsEstimateFees(gasLimit = 1, options) {
    /* eslint-disable-next-line camelcase */
    const { gas_unit_price: gasUnitPrice } = await this.#runJson(['rewards', 'estimate-fees', gasLimit], {
      ...options,
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    return `${gasUnitPrice.amount}${gasUnitPrice.denom}`;
  }

  async #run(queryArgs = [], { node, flags = [], ...options } = {}) {
    const args = [...queryArgs, '--node', node, ...flags];
    const { stdout } = await this.#client.run('query', args, {
      printOutput: false,
      ...options,
      stdio: ['inherit', 'pipe', 'inherit'],
    });
    return stdout;
  }

  async #runJson(queryArgs = [], { node, flags = [], ...options } = {}) {
    const args = [...queryArgs, '--node', node, ...flags];
    return await this.#client.runJson('query', args, {
      printOutput: false,
      ...options,
      stdio: ['inherit', 'pipe', 'pipe'],
    });
  }
}

module.exports = QueryCommands;
