class TxCommands {
  #client;

  constructor(client) {
    this.#client = client;
  }

  async wasm(wasmCommand, wasmArgs, { gas, ...options }) {
    return await this.#run([
      'wasm', wasmCommand, ...wasmArgs,
      '--gas', gas.mode,
      '--gas-prices', gas.prices,
      '--gas-adjustment', gas.adjustment,
    ], options);
  }

  async setContractMetadata(contract, metadata, options) {
    const jsonMetadata = toJsonContractMetadata(metadata);
    return await this.#run([
      'gastracker', 'set-contract-metadata', contract, jsonMetadata,
    ], options);
  }

  async #run(txArgs = [], { from, chainId, node, flags = [], printStdout } = {}) {
    const args = [
      ...txArgs,
      '--from', from,
      '--chain-id', chainId,
      '--node', node,
      '--broadcast-mode', 'sync',
      ...flags
    ];
    return await this.#client.runJson('tx', args, { stdio: ['inherit', 'pipe', 'inherit'], printStdout });
  }
}

function toJsonContractMetadata({
  developerAddress,
  rewardAddress,
  collectPremium = false,
  premiumPercentage = 0,
  gasRebate = false
} = {}) {
  const metadata = {
    developer_address: developerAddress,
    reward_address: rewardAddress,
    collect_premium: collectPremium,
    premium_percentage_charged: premiumPercentage,
    gas_rebate_to_user: gasRebate,
  };
  return JSON.stringify(metadata);
}

module.exports = TxCommands
