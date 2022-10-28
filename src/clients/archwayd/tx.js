class TxCommands {
  #client;

  constructor(client) {
    this.#client = client;
  }

  async wasm(wasmCommand, wasmArgs, options) {
    return await this.#run([
      'wasm', wasmCommand, ...wasmArgs,
    ], options);
  }

  async setContractMetadata(contract, { ownerAddress, rewardsAddress }, options) {
    return await this.#run([
      'rewards', 'set-contract-metadata', contract,
      ...(ownerAddress ? ['--owner-address', ownerAddress] : []),
      ...(rewardsAddress ? ['--rewards-address', rewardsAddress] : []),
    ], options);
  }

  async #run(txArgs = [], { gas = {}, from, chainId, node, flags = [], printStdout } = {}) {
    const gasFlags = await this.#getGasFlags(gas, { node });
    const args = [
      ...txArgs,
      '--from', from,
      '--chain-id', chainId,
      '--node', node,
      '--broadcast-mode', 'sync',
      ...gasFlags,
      ...flags
    ];
    return await this.#client.runJson('tx', args, { stdio: ['inherit', 'pipe', 'inherit'], printStdout });
  }

  async #getGasFlags({ mode = 'auto', prices: defaultGasPrices, adjustment = 1.2 }, options) {
    const gasPrices = await this.#getMinimumConsensusFee(options) || defaultGasPrices;
    return [
      '--gas', mode,
      '--gas-prices', gasPrices,
      '--gas-adjustment', adjustment,
    ];
  }

  async #getMinimumConsensusFee(options) {
    try {
      return await this.#client.query.rewardsEstimateFees(1, { printStdout: false, ...options });
    } catch (e) {
      return null;
    }
  }
}

module.exports = TxCommands;
