const _ = require('lodash');
const chalk = require('chalk');
const { prompts, PromptCancelledError } = require('../util/prompts');
const { isArchwayAddress } = require('../util/validators');
const Config = require('../util/config');

const isValidDeployment = _.conforms({
  type: _.isString,
  chainId: _.isString,
  contract: isArchwayAddress,
  contractMetadata: _.isObject
});
async function storeDeployment(deployment = {}) {
  if (!isValidDeployment(deployment)) {
    console.error(chalk`{red Invalid deployment config}`, deployment);
    throw new Error(`Could not save deployment data to config file`);
  }

  await Config.update(
    { developer: { deployments: [deployment] } },
    { arrayMode: 'prepend' }
  );
}

async function parseTxOptions(config = {}, { confirm, dryRun, flags = [], ...options } = {}) {
  const {
    network: { chainId, urls: { rpc } = {}, gas } = {},
    developer: { deployments = [] } = {}
  } = config;
  const node = `${rpc.url}:${rpc.port}`;
  const { address: lastDeployedContract } = deployments.find(_.matches({ type: 'instantiate', chainId })) || {};
  const { contractMetadata: lastContractMetadata = {} } = deployments.find(_.matches({ type: 'set-metadata', chainId })) || {};

  prompts.override({
    contract: lastDeployedContract || undefined,
    ...options
  });
  const { from, contract, ...contractMetadata } = await prompts([
    {
      type: 'text',
      name: 'from',
      message: chalk`Send tx from which wallet in your keychain? {reset.dim (e.g. "main" or "archway1...")}`,
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
      initial: lastContractMetadata.developerAddress || undefined,
      validate: value => _.isEmpty(_.trim(value)) || isArchwayAddress(_.trim(value)) || 'Invalid address',
      format: value => _.trim(value),
    },
    {
      type: 'text',
      name: 'rewardAddress',
      message: chalk`Enter an address to receive developer rewards {reset.dim (e.g. "archway1...")}`,
      initial: lastContractMetadata.rewardAddress || undefined,
      validate: value => _.isEmpty(_.trim(value)) || isArchwayAddress(_.trim(value)) || 'Invalid address',
      format: value => _.trim(value),
    },
    {
      type: () => options.gasRebate ? null : 'toggle',
      name: 'collectPremium',
      message: chalk`Enable a premium on rewards? {reset.yellow (enabling this feature will automatically disable gas rebate)}`,
      active: 'yes',
      inactive: 'no',
      initial: lastContractMetadata.collectPremium,
    },
    {
      type: (_prev, { collectPremium }) => collectPremium && !options.gasRebate ? 'number' : null,
      name: 'premiumPercentage',
      message: chalk`What should be the percentage of premium rewards? {reset.dim (integer between 0 and 200)}`,
      initial: lastContractMetadata.premiumPercentage || 0,
      min: 0,
      max: 200
    },
    {
      type: (_prev, { collectPremium }) => collectPremium ? null : 'toggle',
      name: 'gasRebate',
      message: `Use the contract rewards for gas rebates to the user?`,
      active: 'yes',
      inactive: 'no',
      initial: lastContractMetadata.gasRebate,
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
  const { chainId, contract, contractMetadata, ...txOptions } = await parseTxOptions(config, options);

  console.info(chalk`Setting metadata for contract {cyan ${contract}}...`);
  const { txhash, code, raw_log } = await archwayd.tx.setContractMetadata(contract, contractMetadata, { chainId, ...txOptions });
  if (!txhash || (code && code !== 0)) {
    console.error(chalk`{yellow Transaction {cyan ${txhash}} failed}`);
    throw new Error(raw_log);
  }

  await storeDeployment({
    type: 'set-metadata',
    chainId,
    contract,
    contractMetadata
  });

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
