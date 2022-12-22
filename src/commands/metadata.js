const _ = require('lodash');
const chalk = require('chalk');
const retry = require('../util/retry');
const { Config } = require('../util/config');
const { prompts, PromptCancelledError } = require('../util/prompts');
const { isArchwayAddress } = require('../util/validators');

async function parseTxOptions(config, { confirm, flags = [], ...options } = {}) {
  const { chainId, urls: { rpc } = {}, gas = {} } = config.get('network', {});
  const node = `${rpc.url}:${rpc.port}`;
  const { codeId, address: lastDeployedContract } = config.deployments.findLastByTypeAndChainId('instantiate', chainId) || {};
  const { contractMetadata: lastContractMetadata = {} } = config.deployments.findLastByTypeAndChainId('set-metadata', chainId) || {};

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
      name: 'ownerAddress',
      message: chalk`Contract owner address which can change the metadata later on {reset.dim (e.g. "archway1...")}`,
      initial: lastContractMetadata.developerAddress || undefined,
      validate: value => _.isEmpty(_.trim(value)) || isArchwayAddress(_.trim(value)) || 'Invalid address',
      format: value => _.trim(value),
    },
    {
      type: 'text',
      name: 'rewardsAddress',
      message: chalk`Address that will receive the rewards {reset.dim (e.g. "archway1...")}`,
      initial: lastContractMetadata.rewardsAddress || undefined,
      validate: value => _.isEmpty(_.trim(value)) || isArchwayAddress(_.trim(value)) || 'Invalid address',
      format: value => _.trim(value),
    },
  ]);

  const extraFlags = _.flatten([
    confirm ? [] : ['--yes'],
  ]).filter(_.isString);

  return {
    ...options,
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
  const { code, raw_log: rawLog, txhash } = await archwayd.tx.setContractMetadata(contract, contractMetadata, { chainId, node, ...txOptions });
  if (code && code !== 0) {
    throw new Error(`Transaction failed: code=${code}, ${rawLog}`);
  }

  await retry(
    async bail => {
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
      console.error(chalk`\n{red.bold Failed to set contract metadata}`);
      console.error(chalk`{red ${e.message}}`);
    }
    throw e;
  }
}

module.exports = main;
