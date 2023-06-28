class TxExecutionError extends Error {
  #code;
  #rawLog;
  #txHash;

  constructor(code, rawLog, txHash) {
    super(`Transaction failed: ${rawLog} (code=${code}, txhash=${txHash})`);
    this.name = 'TxExecutionError';
    this.#code = code;
    this.#rawLog = rawLog;
    this.#txHash = txHash;
  }

  get code() {
    return this.#code;
  }

  get rawLog() {
    return this.#rawLog;
  }

  get txHash() {
    return this.#txHash;
  }
}

class TxCommands {
  #client;

  constructor(client) {
    this.#client = client;
  }

  async wasm(wasmCommand, wasmArgs, options) {
    return await this.#runJson(['wasm', wasmCommand, ...wasmArgs], options);
  }

  async store(wasmPath, options) {
    return await this.wasm('store', [wasmPath], options);
  }

  async instantiate(codeId, instantiateArgs, label, adminAddress, options) {
    return await this.wasm(
      'instantiate',
      [codeId, instantiateArgs, '--label', label, '--admin', adminAddress],
      options
    );
  }

  async setContractMetadata(contract, { ownerAddress, rewardsAddress }, options) {
    return await this.#runJson(
      [
        'rewards',
        'set-contract-metadata',
        contract,
        ownerAddress ? ['--owner-address', ownerAddress] : [],
        rewardsAddress ? ['--rewards-address', rewardsAddress] : [],
      ],
      options
    );
  }

  async setFlatFee(contract, flatFee, options) {
    return await this.#runJson(['rewards', 'set-flat-fee', contract, flatFee], options);
  }

  static assertValidTx({ code, raw_log: rawLog, txhash }) {
    if (code && code !== 0) {
      throw new TxExecutionError(code, rawLog, txhash);
    }
  }

  async #runJson(txArgs = [], { gas = {}, from, chainId, node, flags = [], ...options } = {}) {
    const gasFlags = await this.#getGasFlags(gas, { node });
    const args = [
      ...txArgs,
      ['--from', from],
      ['--chain-id', chainId],
      ['--node', node],
      ['--broadcast-mode', 'sync'],
      ...gasFlags,
      ...flags,
    ].flat();

    const tx = await this.#client.runJson('tx', args, { printOutput: true, ...options });
    TxCommands.assertValidTx(tx);

    return tx;
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

module.exports = { TxCommands, TxExecutionError };
