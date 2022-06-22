const _ = require('lodash');
const chalk = require('chalk');
const { prompts, PromptCancelledError } = require('../util/prompts');
const { Config } = require('../util/config');
const { isJson, isArchwayAddress } = require('../util/validators');
const retry = require('../util/retry');
const Cargo = require('../clients/cargo');

async function parseDeploymentOptions(cargo, config = {}, { adminAddress, confirm, args, label, defaultLabel, codeId: optCodeId, ...options } = {}) {
  if (!_.isEmpty(args) && !isJson(args)) {
    throw new Error(`Arguments should be a JSON string, received "${args}"`);
  }

  const project = await cargo.projectMetadata();
  const { chainId, urls: { rpc } = {}, gas = {} } = config.get('network', {});
  const node = `${rpc.url}:${rpc.port}`;

  const { codeId } = _.defaults({ codeId: optCodeId }, config.deployments.findLast('store', chainId));

  prompts.override({
    args,
    label: label || (defaultLabel && project.id) || undefined,
    ...options
  });
  const { from } = await prompts([
    {
      type: 'text',
      name: 'from',
      message: chalk`Send tx from which wallet in your keychain? {reset.dim (e.g. "main" or crtl+c to quit)}`,
      validate: value => !_.isEmpty(value.trim()) || 'Invalid wallet label',
      format: value => _.trim(value),
    },
  ]);

  const flags = _.flatten([
    confirm ? [] : ['--yes'],
  ]).filter(_.isString);

  return {
    project,
    from,
    adminAddress: adminAddress || from,
    codeId,
    chainId,
    node,
    gas,
    flags
  };
}

async function parseBech32Address(archwayd, address) {
  if (isArchwayAddress(address)) {
    return address;
  }

  console.info(chalk`Fetching address for wallet {cyan ${address}}...`);
  return await archwayd.keys.getAddress(address);
}

async function instantiateContract(archwayd, config, {
  project: { id: projectId } = {},
  adminAddress,
  chainId,
  node,
  codeId,
  ...options
} = {}) {
  console.info(chalk`Instantiating {cyan ${projectId}} from code id {cyan ${codeId}} on {cyan ${chainId}}...`);

  const { label, args } = await prompts([
    {
      type: 'text',
      name: 'label',
      message: chalk`Choose a label for this deployment {reset.dim (type <enter> to use the default)}`,
      initial: projectId,
      validate: value => !_.isEmpty(_.trim(value)) || 'Invalid deployment label',
      format: value => _.trim(value),
    },
    {
      type: 'text',
      name: 'args',
      message: chalk`JSON encoded arguments for contract initialization {reset.dim (e.g. \{ "count": 0 \})}`,
      initial: '{}',
      validate: value => isJson(value) || 'Invalid initialization args - inform a valid JSON string',
    },
  ]);

  const bech32AdminAddress = await parseBech32Address(archwayd, adminAddress);
  const instantiateArgs = [codeId, args, '--label', label, '--admin', bech32AdminAddress];
  const { txhash } = await archwayd.tx.wasm('instantiate', instantiateArgs, { chainId, node, ...options });
  const contractAddress = await retry(
    () => archwayd.query.txEventAttribute(txhash, 'instantiate', '_contract_address', { node, printStdout: false }),
    { text: chalk`Waiting for tx {cyan ${txhash}} to confirm...` }
  );
  if (!txhash || !contractAddress) {
    throw new Error(`Failed to instantiate contract with code_id=${codeId} and args="${args}"`);
  }

  await config.deployments.add({
    type: 'instantiate',
    chainId,
    codeId,
    txhash,
    address: contractAddress,
    admin: bech32AdminAddress
  });

  console.info(chalk`\n{green Successfully instantiated the contract}`);
  console.info(chalk`{white   Chain Id:  {cyan ${chainId}}}`);
  console.info(chalk`{white   Tx Hash:   {cyan ${txhash}}}`);
  console.info(chalk`{white   Address:   {cyan ${contractAddress}}}`);
  console.info(chalk`{white   Arguments: {cyan ${args}}}`);

  console.warn(chalk`\n{whiteBright It is recommended that you now set the contract metadata using the command {magenta archway metadata}}`);
}

async function instantiate(archwayd, { deployOptions, ...options } = {}) {
  const config = await Config.open();
  const cargo = new Cargo();

  deployOptions = deployOptions || await parseDeploymentOptions(cargo, config, options);

  await instantiateContract(archwayd, config, deployOptions);
}

async function main(archwayd, options = {}) {
  try {
    await instantiate(archwayd, options);
  } catch (e) {
    if (e instanceof PromptCancelledError) {
      console.warn(chalk`{yellow ${e.message}}`);
    } else {
      console.error(chalk`\n{red.bold Failed to instantiate contract}`);
      throw e;
    }
  }
}

module.exports = main;
