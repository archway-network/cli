const _ = require('lodash');
const chalk = require('chalk');
const Cargo = require('../clients/cargo');
const { retryTx } = require('../util/retry');
const { Config } = require('../util/config');
const { prompts, PromptCancelledError } = require('../util/prompts');
const { isArchwayAddress } = require('../util/validators');

// eslint-disable-next-line no-unused-vars
const { ArchwayClient } = require('../clients/archwayd');

async function parseTxOptions(config, { name: projectName }, { confirm, flags = [], ...options } = {}) {
  const { chainId, urls: { rpc } = {}, gas = {} } = config.get('network', {});
  const node = `${rpc.url}:${rpc.port}`;
  const { codeId, address: lastDeployedContract } =
    config.deployments.findLastByTypeAndProjectAndChainId('instantiate', projectName, chainId) || {};
  const { contractMetadata: lastContractMetadata = {} } =
    config.deployments.findLastByTypeAndProjectAndChainId('set-metadata', projectName, chainId) || {};

  prompts.override({
    contract: lastDeployedContract || undefined,
    ...options,
  });
  const { from, contract, ownerAddress, rewardsAddress } = await prompts([
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
      initial: lastDeployedContract,
      validate: value => isArchwayAddress(_.trim(value)) || 'Invalid address',
      format: value => _.trim(value),
    },
    {
      type: 'text',
      name: 'ownerAddress',
      message: chalk`Contract owner address which can change the metadata later on {reset.dim (e.g. "archway1...")}`,
      initial: lastContractMetadata?.ownerAddress,
      validate: value => _.isEmpty(_.trim(value)) || isArchwayAddress(_.trim(value)) || 'Invalid address',
      format: value => _.trim(value),
    },
    {
      type: 'text',
      name: 'rewardsAddress',
      message: chalk`Address that will receive the rewards {reset.dim (e.g. "archway1...")}`,
      initial: lastContractMetadata?.rewardsAddress,
      validate: value => _.isEmpty(_.trim(value)) || isArchwayAddress(_.trim(value)) || 'Invalid address',
      format: value => _.trim(value),
    },
  ]);

  const extraFlags = _.flatten([confirm ? [] : ['--yes']]).filter(_.isString);
  const contractMetadata = { ownerAddress, rewardsAddress };

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

/**
 * Sets a contract rewards metadata.
 *
 * @param {ArchwayClient} archwayd
 * @param {Cargo} cargo
 * @param {object} options
 */
async function setContractMetadata(archwayd, cargo, options = {}) {
  const config = await Config.open();
  const project = await cargo.projectMetadata();
  const { chainId, codeId, contract, contractMetadata, node, ...txOptions } = await parseTxOptions(
    config,
    project,
    options
  );

  console.info(chalk`Setting metadata for contract {cyan ${contract}} on {cyan ${chainId}}...`);
  const { txhash } = await archwayd.tx.setContractMetadata(contract, contractMetadata, { chainId, node, ...txOptions });
  await retryTx(archwayd, txhash, { node });

  await config.deployments.add({
    project: project.name,
    type: 'set-metadata',
    chainId,
    codeId,
    txhash,
    contract,
    contractMetadata,
  });

  console.info(chalk`\n{green Successfully set contract metadata}`);
  console.info(chalk`{white   Chain Id: {cyan ${chainId}}}`);
  console.info(chalk`{white   Tx Hash:  {cyan ${txhash}}}`);
  console.info(chalk`{white   Address:  {cyan ${contract}}}`);
  console.info(chalk`{white   Metadata: {cyan ${JSON.stringify(contractMetadata)}}}`);
}

async function main(archwayd, options = {}) {
  try {
    const cargo = new Cargo();
    await setContractMetadata(archwayd, cargo, options);
  } catch (e) {
    if (e instanceof PromptCancelledError) {
      console.warn(chalk`{yellow ${e.message}}`);
    } else {
      console.error(chalk`\n{red.bold Failed to set contract metadata}`);
    }
    throw e;
  }
}

module.exports = main;
