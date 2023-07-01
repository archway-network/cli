const _ = require('lodash');
const { isCoin, isJson } = require('../../util/validators');

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

  async instantiate(codeId, args, label, adminAddress, options) {
    return await this.wasm(
      'instantiate',
      [codeId, parseJsonArgs(args), '--label', label, '--admin', adminAddress],
      options
    );
  }

  async execute(contract, args, { gas, ...options }) {
    const executeArgs = [contract, parseJsonArgs(args)];
    const gasEstimate = await this.wasm('execute', executeArgs, {
      ...options,
      gas: { ...gas, adjustment: 1.5 },
      simulate: true,
    });
    if (!_.isNumber(gasEstimate)) {
      throw new Error('failed to simulate gas estimate');
    }

    const { estimatedFee } = await this.#getEstimatedFee(gasEstimate, { ...options, contract });
    if (_.isEmpty(estimatedFee)) {
      throw new Error('failed to calculate estimated fee');
    }

    const fees = `${estimatedFee.amount}${estimatedFee.denom}`;
    return await this.wasm('execute', executeArgs, {
      ...options,
      gas: { ...gas, mode: gasEstimate },
      fees,
    });
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
    if (code && _.toInteger(code) !== 0) {
      throw new TxExecutionError(code, rawLog, txhash);
    }
  }

  async #runJson(txArgs = [], { fees, gas, from, chainId, node, flags = [], simulate = false, ...options } = {}) {
    if (_.isEmpty(chainId)) {
      throw new Error('missing chainId argument');
    }
    if (_.isEmpty(node)) {
      throw new Error('missing node argument');
    }

    const gasFlags = await this.#getGasFlags(gas, fees, simulate, { node });
    const args = [
      ...txArgs,
      ['--from', from],
      ['--chain-id', chainId],
      ['--node', node],
      ['--broadcast-mode', 'sync'],
      ...gasFlags,
      ...flags,
    ].flat();

    if (simulate) {
      return await this.#client.simulate('tx', args, options);
    }

    const tx = await this.#client.runJson('tx', args, { printOutput: true, ...options });
    TxCommands.assertValidTx(tx);

    return tx;
  }

  async #getGasFlags(gas = {}, fees, simulate = false, options) {
    const { mode: gasWanted = 'auto', prices: defaultGasPrices, adjustment = 1.2 } = gas;
    if (isCoin(fees)) {
      return ['--gas', gasWanted, '--fees', fees];
    } else if (simulate) {
      return ['--gas', gasWanted, '--gas-adjustment', adjustment];
    } else {
      const { gasUnitPrice } = await this.#getEstimatedFee(1, options);
      const gasPrices = gasUnitPrice ? `${gasUnitPrice.amount}${gasUnitPrice.denom}` : defaultGasPrices;
      return ['--gas', gasWanted, '--gas-adjustment', adjustment, '--gas-prices', gasPrices];
    }
  }

  async #getEstimatedFee(gasLimit, { contract, node }) {
    try {
      return await this.#client.query.rewardsEstimateFees(gasLimit, { contract, node });
    } catch (e) {
      return {};
    }
  }
}

function parseJsonArgs(args) {
  args = _.isPlainObject(args) ? JSON.stringify(args) : args;
  if (!isJson(args)) {
    throw new Error('invalid JSON args');
  }
  return args;
}

module.exports = { TxCommands, TxExecutionError };
