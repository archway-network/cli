const _ = require('lodash');
const chalk = require('chalk');
const { Config } = require('../util/config');
const { prompts, PromptCancelledError } = require('../util/prompts');
const { isArchwayAddress, isJson } = require('../util/validators');

async function parseQueryOptions(config, { args, flags = [], ...options } = {}) {
  if (!_.isEmpty(args) && !isJson(args)) {
    throw new Error(`Arguments should be a JSON string, received "${args}"`);
  }

  const { chainId, urls: { rpc } = {}, gas = {} } = config.get('network', {});
  const node = `${rpc.url}:${rpc.port}`;
  const { address: lastDeployedContract } = config.deployments.findLast('instantiate', chainId) || {};
  prompts.override({ contract: lastDeployedContract || undefined, ...options });

  const {contract } = await prompts([
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
  }
}

async function querySmart(archwayd, {module,type, ...options}) {
  const config = await Config.open();
  const { node, contract, args, ...txOptions } = await parseQueryOptions(config, options);
  console.info(chalk`Querying smart contract {cyan ${contract}}...`);
  const response = await archwayd.query.smartContract(module, type, contract, args, { node, ...txOptions });
  console.info(chalk`{green Query successful {cyan ${response}}}\n`);
}

async function main(archwayd, {module,type, ...options}) {
  try {
   await querySmart(archwayd, {module,type,options});
  } catch (e) {
    if (e instanceof PromptCancelledError) {
      console.warn(chalk`{yellow ${e.message}}`);
    } else {
      console.error(chalk`\n{red.bold Failed to query transaction}`);
      console.error(e);
      process.exit(1);
    }
  }
}

module.exports = main;
