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

  async setContractMetadata(contract, metadata, options) {
    const jsonMetadata = toJsonContractMetadata(metadata);
    return await this.#run([
      'gastracker', 'set-contract-metadata', contract, jsonMetadata,
    ], options);
  }

  async #run(txArgs = [], { gas = {}, from, chainId, node, flags = [], printStdout } = {}) {
    const gasFlags = await this.#getGasFlags(gas, { node, flags, printStdout });
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

  async #getGasFlags({ mode = 'auto', adjustment = 1.2 }, options) {
    const gasPrices = await this.#getMinimumConsensusFee(options);
    return [
      '--gas', mode,
      '--gas-prices', gasPrices,
      '--gas-adjustment', adjustment,
    ];
  }

  async #getMinimumConsensusFee(options) {
    try {
      return await this.#client.query.rewardsEstimateFees(1, options);
    } catch (e) {
      return null;
    }
  }
}

function toJsonContractMetadata({
  developerAddress,
  rewardAddress,
  collectPremium = false,
  premiumPercentage = 0,
  gasRebate = false
} = {}) {
  /* eslint-disable */
  const metadata = {
    developer_address: developerAddress,
    reward_address: rewardAddress,
    collect_premium: collectPremium,
    premium_percentage_charged: premiumPercentage,
    gas_rebate_to_user: gasRebate,
  };
  /* eslint-enable */
  return JSON.stringify(metadata);
}

module.exports = TxCommands;
