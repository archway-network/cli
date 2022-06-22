const _ = require('lodash');
const chalk = require('chalk');
const retry = require('../util/retry');
const { Config } = require('../util/config');
const { prompts, PromptCancelledError } = require('../util/prompts');
const { isArchwayAddress } = require('../util/validators');

async function parseTxOptions(config, { confirm, flags = [], ...options } = {}) {
  const { chainId, urls: { rpc } = {}, gas = {} } = config.get('network', {});
  const node = `${rpc.url}:${rpc.port}`;
  const { codeId, address: lastDeployedContract } = config.deployments.findLast('instantiate', chainId) || {};
  const { contractMetadata: lastContractMetadata = {} } = config.deployments.findLast('set-metadata', chainId) || {};

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

  const extraFlags = _.flatten([
    confirm ? [] : ['--yes'],
  ]).filter(_.isString);

  return {
    contract,
    from,
    codeId,
    chainId,
    node,
    gas,
    contractMetadata,
    flags: [...extraFlags, ...flags],
  };
}

async function setContractMetadata(archwayd, options = {}) {
  const config = await Config.open();
  const { chainId, codeId, contract, contractMetadata, node, ...txOptions } = await parseTxOptions(config, options);

  console.info(chalk`Setting metadata for contract {cyan ${contract}} on {cyan ${chainId}}...`);
  const { txhash } = await archwayd.tx.setContractMetadata(contract, contractMetadata, { chainId, node, ...txOptions });
  await retry(
    async (bail) => {
      const { code, raw_log: rawLog } = await archwayd.query.tx(txhash, { node, printStdout: false });
      if (code && code !== 0) {
        const error = new Error(rawLog);
        bail(error);
        throw error;
      }
    },
    { text: chalk`Waiting for tx {cyan ${txhash}} to confirm...` }
  );

  await config.deployments.add({
    type: 'set-metadata',
    chainId,
    codeId,
    txhash,
    contract,
    contractMetadata
  });

  console.info(chalk`\n{green Successfully set contract metadata}`);
  console.info(chalk`{white   Chain Id: {cyan ${chainId}}}`);
  console.info(chalk`{white   Tx Hash:  {cyan ${txhash}}}`);
  console.info(chalk`{white   Address:  {cyan ${contract}}}`);
  console.info(chalk`{white   Metadata: {cyan ${JSON.stringify(contractMetadata)}}}`);
}

async function main(archwayd, options = {}) {
  try {
    await setContractMetadata(archwayd, options);
  } catch (e) {
    if (e instanceof PromptCancelledError) {
      console.warn(chalk`{yellow ${e.message}}`);
    } else {
      console.error(chalk`\n{red.bold Failed to deploy project}`);
      throw e;
    }
  }
}

module.exports = main;
