const _ = require('lodash');
const chalk = require('chalk');
const Cargo = require('../clients/cargo');
const { Config } = require('../util/config');
const { prompts, PromptCancelledError } = require('../util/prompts');
const { isArchwayAddress, isJson } = require('../util/validators');

async function parseQueryOptions(config, { name: projectName }, { args, flags = [], contract: optContract, options } = {}) {
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

  const { contract } = await prompts([
    {
      type: 'text',
      name: 'contract',
      message: chalk`Enter the smart contract address you would like to query from {reset.dim (e.g. "archway1...")}`,
      validate: value => isArchwayAddress(_.trim(value)) || 'Invalid address',
      format: value => _.trim(value),
    },
  ]);
  return {
    contract,
    args: args || '{}',
    chainId,
    node,
    gas,
    flags: [...flags],
  };
}

async function querySmart(archwayd, cargo, { module, type, options: { raw, ...options } }) {
  const config = await Config.open();
  const project = await cargo.projectMetadata();
  const { node, contract, args, ...queryOptions } = await parseQueryOptions(config, project, options);

  raw || console.info(chalk`Querying smart contract {cyan ${contract}}...`);

  const response = await archwayd.query.smartContract(module, type, contract, args, { node, ...queryOptions });

  raw || console.info(chalk`{green Query successful!}`);

  console.info(JSON.stringify(response, null, 2));
}

async function main(archwayd, { module, type, options }) {
  try {
    const cargo = new Cargo();
    await querySmart(archwayd, cargo, { module, type, options });
  } catch (e) {
    if (e instanceof PromptCancelledError) {
      console.warn(chalk`{yellow ${e.message}}`);
    } else {
      console.error(chalk`\n{red.bold Failed to query transaction}`);
    }
    throw e;
  }
}

module.exports = main;
