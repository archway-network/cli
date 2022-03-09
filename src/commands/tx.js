// archway-cli/util/tx.js

const _ = require('lodash');
const chalk = require('chalk');
const { prompts, PromptCancelledError } = require('../util/prompts');
const Config = require('../util/config');
const { isArchwayAddress, isJson } = require('../util/validators');

async function parseTxOptions(config = {}, { confirm, dryRun, args, flags = [], ...options } = {}) {
  if (!_.isEmpty(args) && !isJson(args)) {
    throw new Error(`Arguments should be a JSON string, received "${args}"`);
  }

  const {
    network: { chainId, urls: { rpc } = {}, gas } = {},
    developer: { deployments = [] } = {}
  } = config;
  const node = `${rpc.url}:${rpc.port}`;
  const { address: lastDeployedContract } = deployments.find(_.matches({ type: 'instantiate', chainId })) || {};

  prompts.override({ contract: lastDeployedContract || undefined, ...options });
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

  const extraFlags = [
    confirm || '--yes',
    dryRun && '--dry-run',
  ].filter(_.isString);

  return {
    contract,
    args: args || '{}',
    from,
    chainId,
    node,
    gas,
    flags: [...extraFlags, ...flags],
  }
}

async function executeTx(archwayd, options) {
  const config = await Config.read();
  const { contract, args, ...txOptions } = await parseTxOptions(config, options);

  console.info(chalk`Executing tx on contract {cyan ${contract}}...`);
  await archwayd.tx.wasm('execute', [contract, args], txOptions);
}

async function main(archwayd, options) {
  try {
    await executeTx(archwayd, options);
  } catch (e) {
    if (e instanceof PromptCancelledError) {
      console.warn(chalk`{yellow ${e.message}}`);
    } else {
      console.error(chalk`\n{red {bold Failed to execute transaction}\n${e.stack}}`);
    }
  }
}

module.exports = main;
