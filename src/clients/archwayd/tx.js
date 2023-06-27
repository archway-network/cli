class TxCommands {
  #client;

  constructor(client) {
    this.#client = client;
  }

  async wasm(wasmCommand, wasmArgs, options) {
    return await this.#runJson(['wasm', wasmCommand, ...wasmArgs], options);
  }

  async setContractMetadata(contract, { ownerAddress, rewardsAddress }, options) {
    return await this.#runJson(
      [
        'rewards',
        'set-contract-metadata',
        contract,
        ...(ownerAddress ? ['--owner-address', ownerAddress] : []),
        ...(rewardsAddress ? ['--rewards-address', rewardsAddress] : []),
      ],
      options
    );
  }

  async #runJson(txArgs = [], { gas = {}, from, chainId, node, flags = [], ...options } = {}) {
    const gasFlags = await this.#getGasFlags(gas, { node });
    const args = [
      ...txArgs,
      '--from',
      from,
      '--chain-id',
      chainId,
      '--node',
      node,
      '--broadcast-mode',
      'sync',
      ...gasFlags,
      ...flags,
    ];
    return await this.#client.runJson('tx', args, { printOutput: true, ...options });
  }

  async #getGasFlags({ mode = 'auto', prices: defaultGasPrices, adjustment = 1.2 }, options) {
    const gasPrices = (await this.#getMinimumConsensusFee(options)) || defaultGasPrices;
    return ['--gas', mode, '--gas-prices', gasPrices, '--gas-adjustment', adjustment];
  }

  async #getMinimumConsensusFee(options) {
    try {
      return await this.#client.query.rewardsEstimateFees(1, options);
    } catch (e) {
      return undefined;
    }
  }
}

module.exports = TxCommands;
