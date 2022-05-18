class QueryCommands {
  #client;

  constructor(client) {
    this.#client = client;
  }

  async tx(txhash, options) {
    return await this.#run(['tx', txhash], options);
  }

  async txEventAttribute(txhash, eventType, attributeKey, options) {
    const transaction = await this.tx(txhash, options);
    const { logs: [{ events = [] } = {},] = [] } = transaction;
    const { attributes = [] } = events.find(event => event.type === eventType) || {};
    const { value } = attributes.find(attribute => attribute.key === attributeKey) || {};
    return value;
  }

  async #run(queryArgs = [], { node, flags = [], printStdout } = {}) {
    const args = [
      ...queryArgs,
      '--node', node,
      '--output', 'json',
      ...flags
    ];
    return await this.#client.runJson('query', args, { maxBuffer: 1024 * 1024, printStdout });
  }
}

module.exports = QueryCommands
