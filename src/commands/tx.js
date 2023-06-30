const _ = require('lodash');
const chalk = require('chalk');
const Cargo = require('../clients/cargo');
const { retryTx } = require('../util/retry');
const { Config } = require('../util/config');
const { prompts, PromptCancelledError } = require('../util/prompts');
const { isArchwayAddress, isJson } = require('../util/validators');

// eslint-disable-next-line no-unused-vars
const { ArchwayClient, TxExecutionError, assertValidTx } = require('../clients/archwayd');

async function parseTxOptions(
  config,
  { name: projectName },
  { confirm, args, flags = [], contract: optContract, ...options } = {}
) {
  if (!_.isEmpty(args) && !isJson(args)) {
    throw new Error(`Arguments should be a JSON string, received "${args}"`);
  }

  const { chainId, urls: { rpc } = {}, gas = {} } = config.get('network', {});
  const node = `${rpc.url}:${rpc.port}`;
  const { address: lastDeployedContract } = _.defaults(
    { address: optContract },
    config.deployments.findLastByTypeAndProjectAndChainId('instantiate', projectName, chainId)
  );

  prompts.override({ contract: lastDeployedContract, ...options });
  const { from, contract } = await prompts([
    {
      type: 'text',
      name: 'from',
      message: chalk`Send tx from which wallet in your keychain? {reset.dim (e.g. "main" or crtl+c to quit)}`,
      validate: value => !_.isEmpty(value.trim()) || 'Invalid wallet label',
      format: value => _.trim(value),
    },
    {
      type: 'text',
      name: 'contract',
      message: chalk`Enter the smart contract address {reset.dim (e.g. "archway1...")}`,
      validate: value => isArchwayAddress(_.trim(value)) || 'Invalid address',
      format: value => _.trim(value),
    },
  ]);

  const extraFlags = _.flatten([confirm ? [] : ['--yes']]).filter(_.isString);

  return {
    contract,
    args: args || '{}',
    from,
    chainId,
    node,
    gas,
    flags: [...extraFlags, ...flags],
  };
}

/**
 * Executes a transaction on a WASM contract.
 *
 * @param {ArchwayClient} archwayd
 * @param {Cargo} cargo
 * @param {object} options
 */
async function executeTx(archwayd, cargo, options = {}) {
  const config = await Config.open();
  const project = await cargo.projectMetadata();
  const { node, contract, args, ...txOptions } = await parseTxOptions(config, project, options);

  console.info(chalk`Executing tx on contract {cyan ${contract}}...`);
  const { txhash } = await archwayd.tx.execute(contract, args, { node, ...txOptions });
  await retryTx(archwayd, txhash, { node });

  console.info(chalk`{green Executed tx on contract {cyan ${contract}}}\n`);
}

async function main(archwayd, options = {}) {
  try {
    const cargo = new Cargo();
    await executeTx(archwayd, cargo, options);
  } catch (e) {
    if (e instanceof PromptCancelledError) {
      console.warn(chalk`{yellow ${e.message}}`);
    } else {
      console.error(chalk`\n{red.bold Failed to execute transaction}`);
    }
    throw e;
  }
}

module.exports = main;
