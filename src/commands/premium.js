const _ = require('lodash');
const chalk = require('chalk');
const Cargo = require('../clients/cargo');
const { retryTx } = require('../util/retry');
const { Config } = require('../util/config');
const { prompts, PromptCancelledError } = require('../util/prompts');
const { isArchwayAddress, isCoin } = require('../util/validators');

// eslint-disable-next-line no-unused-vars
const { ArchwayClient, getTxEventAttribute } = require('../clients/archwayd');

const DeploymentType = 'set-premium';

async function parseTxOptions(config, { name: projectName }, { confirm, flags = [], ...options } = {}) {
  const {
    fees: { feeDenom },
    chainId,
    urls: { rpc } = {},
    gas = {},
  } = config.get('network', {});
  const node = `${rpc.url}:${rpc.port}`;
  const { codeId, address: lastDeployedContract } =
    config.deployments.findLastByTypeAndProjectAndChainId('instantiate', projectName, chainId) || {};
  const { contractPremium: lastContractPremium = {} } =
    config.deployments.findLastByTypeAndProjectAndChainId(DeploymentType, projectName, chainId) || {};

  prompts.override({
    contract: lastDeployedContract || undefined,
    ...options,
  });
  const { from, contract, flatFee } = await prompts([
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
      name: 'flatFee',
      message: chalk`Amount charged for the flat fee {reset.dim (e.g. "100${feeDenom}")}`,
      initial: lastContractPremium?.flatFee || undefined,
      validate: value =>
        _.isEmpty(_.trim(value)) ||
        isCoin(_.trim(value), feeDenom) ||
        `Invalid flat fee amount - please use the denom for the current network: ${feeDenom}`,
      format: value => _.trim(value),
    },
  ]);

  const extraFlags = _.flatten([confirm ? [] : ['--yes']]).filter(_.isString);

  return {
    ...options,
    contract,
    from,
    codeId,
    chainId,
    node,
    gas,
    flatFee,
    flags: [...extraFlags, ...flags],
  };
}

/**
 * Sets a contract premium flat fee.
 *
 * @param {ArchwayClient} archwayd
 * @param {Cargo} cargo
 * @param {object} options
 */
async function setContractPremium(archwayd, cargo, options = {}) {
  const config = await Config.open();
  const project = await cargo.projectMetadata();
  const { chainId, codeId, contract, flatFee, node, ...txOptions } = await parseTxOptions(config, project, options);

  console.info(chalk`Setting metadata for contract {cyan ${contract}} on {cyan ${chainId}}...`);
  const { txhash } = await archwayd.tx.setFlatFee(contract, flatFee, { chainId, node, ...txOptions });
  const tx = await retryTx(archwayd, txhash, { node });
  const flatFeeAttr = getTxEventAttribute(tx, 'archway.rewards.v1.ContractFlatFeeSetEvent', 'flat_fee', { node });

  await config.deployments.add({
    project: project.name,
    type: DeploymentType,
    chainId,
    codeId,
    txhash,
    contract,
    flatFee: JSON.parse(flatFeeAttr),
  });

  console.info(chalk`\n{green Successfully set contract premium}`);
  console.info(chalk`{white   Chain Id: {cyan ${chainId}}}`);
  console.info(chalk`{white   Tx Hash:  {cyan ${txhash}}}`);
  console.info(chalk`{white   Address:  {cyan ${contract}}}`);
  console.info(chalk`{white   Flat Fee: {cyan ${flatFee}}}`);
}

async function main(archwayd, options = {}) {
  try {
    const cargo = new Cargo();
    await setContractPremium(archwayd, cargo, options);
  } catch (e) {
    if (e instanceof PromptCancelledError) {
      console.warn(chalk`{yellow ${e.message}}`);
    } else {
      console.error(chalk`\n{red.bold Failed to set contract premium}`);
    }
    throw e;
  }
}

module.exports = main;
