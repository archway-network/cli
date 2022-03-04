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

  async #run(txArgs = [], { from, chainId, node, flags = [] } = {}) {
    const args = [
      ...txArgs,
      '--from', from,
      '--chain-id', chainId,
      '--node', node,
      '--broadcast-mode', 'block',
      '--output', 'json',
      ...flags
    ];
    const archwayd = this.#client.run('tx', args, { stdio: ['inherit', 'pipe', 'inherit'] });
    archwayd.stdout.pipe(process.stdout);
    const { stdout } = await archwayd;

    const lines = stdout.replace('\r', '').split('\n');
    const jsonLines = lines.filter(line => line.startsWith('{'));
    return JSON.parse(jsonLines.pop());
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
