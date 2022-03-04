class TxCommands {
  #client;

  constructor(client) {
    this.#client = client;
  }

  async wasm(wasmCommand, wasmArgs, { from, chainId, node, gas, flags = [] } = {}) {
    return await this.#run([
      'wasm', wasmCommand, ...wasmArgs,
      '--from', from,
      '--chain-id', chainId,
      '--node', node,
      '--gas', gas.mode,
      '--gas-prices', gas.prices,
      '--gas-adjustment', gas.adjustment,
      '--broadcast-mode', 'block',
      '--output', 'json',
      ...flags
    ]);
  }

  async #run(args) {
    const archwayd = this.#client.run('tx', args, { stdio: ['inherit', 'pipe', 'inherit'] });
    archwayd.stdout.pipe(process.stdout);
    const { stdout } = await archwayd;

    const lines = stdout.replace('\r', '').split('\n');
    const jsonLines = lines.filter(line => line.startsWith('{'));
    return JSON.parse(jsonLines.pop());
  }
}

module.exports = TxCommands
