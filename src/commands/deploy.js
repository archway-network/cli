const _ = require('lodash');
const chalk = require('chalk');
const { prompts, PromptCancelledError } = require('../util/prompts');
const { isJson, isArchwayAddress } = require('../util/validators');
const Config = require('../util/config');
const Cargo = require('../clients/cargo');
const Build = require('./build');
const Store = require('./store');

async function parseBech32Address(archwayd, address) {
  if (isArchwayAddress(address)) {
    return address;
  }

  console.info(chalk`Fetching address for wallet {cyan ${address}}...`);
  return await archwayd.keys.getAddress(address);
}

async function instantiateContract(archwayd, options = {}) {
  const {
    project: { id: projectId } = {},
    from,
    adminAddress,
    chainId,
    wasm: { codeId } = {}
  } = options;

  console.info(chalk`Instantiating {cyan ${projectId}} on {cyan ${chainId}} using wallet {cyan ${from}}...`);

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
  const { txhash } = archwayd.tx.wasm('instantiate', instantiateArgs, options);
  const contractAddress = archwayd.query.txEventAttribute(txhash, 'instantiate', '_contract_address');
  if (!txhash || !contractAddress) {
    throw new Error(`Failed to instantiate contract with code_id=${codeId} and args=${args}`);
  }

  await Config.deployments.add({
    type: 'instantiate',
    chainId: chainId,
    codeId: codeId,
    address: contractAddress,
    admin: bech32AdminAddress
  });

  console.info(chalk`{green Successfully instantiated contract with address {cyan ${contractAddress}} on tx hash {cyan ${txhash}} at {cyan ${chainId}}}\n`);
  console.warn(chalk`{whiteBright It is recommended that you now set the contract metadata using the {green.bold archway metadata} command}`);

  return { contractAddress };
}

async function parseDeploymentOptions(cargo, config = {}, { adminAddress, confirm, args, label, defaultLabel, ...options } = {}) {
  if (!_.isEmpty(args) && !isJson(args)) {
    throw new Error(`Arguments should be a JSON string, received "${args}"`);
  }

  const project = await cargo.projectMetadata();
  const {
    network: { chainId, urls: { rpc } = {}, gas } = {}
  } = config;
  const node = `${rpc.url}:${rpc.port}`;

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

  const flags = [
    confirm || '--yes',
    // FIXME: --dry-run is not working as expected on archwayd
    // dryRun && '--dry-run',
  ].filter(_.isString);

  return {
    project,
    from,
    adminAddress: adminAddress || from,
    chainId,
    node,
    gas,
    flags
  }
}

async function deploy(archwayd, { build = true, dryRun = false, ...options } = {}) {
  build && await Build({ optimize: true });

  // TODO: call archwayd operations with the --dry-run flag
  if (dryRun) {
    return;
  }

  const config = await Config.read();
  const cargo = new Cargo();

  const deployOptions = await parseDeploymentOptions(cargo, config, options);
  await Store(archwayd, { dryRun, deployOptions });

  // await instantiateContract(archwayd, deployedWasmConfig);
}

async function main(archwayd, options = {}) {
  try {
    await deploy(archwayd, options);
  } catch (e) {
    if (e instanceof PromptCancelledError) {
      console.warn(chalk`{yellow ${e.message}}`);
    } else {
      console.error(chalk`\n{red {bold Failed to deploy project}\n${e.stack}}`);
    }
  }
}

module.exports = main;
