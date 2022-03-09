const _ = require('lodash');
const chalk = require('chalk');
const { prompts, PromptCancelledError } = require('../util/prompts');
const { isArchwayAddress } = require('../util/validators');
const Config = require('../util/config');

async function parseTxOptions(config = {}, { confirm, dryRun, flags = [], ...options } = {}) {
  const {
    network: { chainId, urls: { rpc } = {}, gas } = {},
    developer: { contractMetadata: configContractMetadata, deployments = [] } = {}
  } = config;
  const node = `${rpc.url}:${rpc.port}`;
  const { address: lastDeployedContract } = deployments.find(deployment => deployment.type == 'instantiate');

  prompts.override({
    contract: lastDeployedContract || undefined,
    ...configContractMetadata,
    ...options
  });
  const { from, contract, ...contractMetadata } = await prompts([
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
    {
      type: 'text',
      name: 'developerAddress',
      message: chalk`Developer address which can change the metadata later on {reset.dim (e.g. "archway1...")}`,
      validate: value => _.isEmpty(_.trim(value)) || isArchwayAddress(_.trim(value)) || 'Invalid address',
      format: value => _.trim(value),
    },
    {
      type: 'text',
      name: 'rewardAddress',
      message: chalk`Enter an address to receive developer rewards {reset.dim (e.g. "archway1...")}`,
      validate: value => _.isEmpty(_.trim(value)) || isArchwayAddress(_.trim(value)) || 'Invalid address',
      format: value => _.trim(value),
    },
    {
      type: 'toggle',
      name: 'collectPremium',
      message: `Enable a premium on rewards?`,
      initial: false,
    },
    {
      type: prev => prev ? 'number' : null,
      name: 'premiumPercentage',
      message: chalk`What should be the percentage of premium rewards? {reset.dim (integer between 0 and 200)}`,
      initial: 0,
      min: 0,
      max: 200
    },
    {
      type: 'toggle',
      name: 'gasRebate',
      message: `Use the contract rewards for gas rebates to the user?`,
      initial: false,
    },
  ]);

  const extraFlags = [
    confirm || '--yes',
    dryRun && '--dry-run',
  ].filter(_.isString);

  return {
    contract,
    from,
    chainId,
    node,
    gas,
    contractMetadata,
    flags: [...extraFlags, ...flags],
  }
}

async function setContractMetadata(archwayd, options = {}) {
  const config = await Config.read();
  const { contract, contractMetadata, ...txOptions } = await parseTxOptions(config, options);

  console.info(chalk`Setting metadata for contract {cyan ${contract}}...`);
  const { txhash, code, raw_log } = await archwayd.tx.setContractMetadata(contract, contractMetadata, txOptions);
  if (!txhash || (code && code !== 0)) {
    console.error(chalk`{yellow Transaction {cyan ${txhash}} failed}`);
    throw new Error(raw_log);
  }

  await Config.update({ developer: { contractMetadata } });

  console.info(chalk`{green Successfully set contract metadata on tx hash {cyan ${txhash}}}\n`);
}

async function main(archwayd, options = {}) {
  try {
    await setContractMetadata(archwayd, options);
  } catch (e) {
    if (e instanceof PromptCancelledError) {
      console.warn(chalk`{yellow ${e.message}}`);
    } else {
      console.error(chalk`\n{red {bold Failed to deploy project}\n${e.stack}}`);
    }
  }
}

module.exports = main;
