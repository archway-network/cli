const _ = require('lodash');
const chalk = require('chalk');
const { prompts, PromptCancelledError } = require('../util/prompts');
const { isJson } = require('../util/validators');
const { Config } = require('../util/config');
const Cargo = require('../clients/cargo');
const Build = require('./build');
const Instantiate = require('./instantiate');
const Store = require('./store');

async function parseDeploymentOptions(cargo, config, { adminAddress, confirm, args, label, defaultLabel, ...options } = {}) {
  if (!_.isEmpty(args) && !isJson(args)) {
    throw new Error(`Arguments should be a JSON string, received "${args}"`);
  }

  const project = await cargo.projectMetadata();
  const { chainId, urls: { rpc } = {}, gas = {} } = config.get('network', {});
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

  const flags = _.flatten([
    confirm ? [] : ['--yes'],
    // FIXME: --dry-run is not working as expected on archwayd
    // dryRun ? ['--dry-run'] : [],
  ]).filter(_.isString);

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

/**
 * @see Build
 * @see Store
 * @see Instantiate
 * @deprecated since v1.2.0
 */
async function deploy(archwayd, { build = true, ...options } = {}) {
  build && await Build({ optimize: true });

  const config = await Config.open();
  const cargo = new Cargo();

  const deployOptions = await parseDeploymentOptions(cargo, config, options);
  await Store(archwayd, deployOptions);
  await Instantiate(archwayd, deployOptions);
}

async function main(archwayd, options = {}) {
  try {
    console.warn(chalk`{yellow {bold WARNING:} This command is deprecated and will be removed in future versions}`);
    console.warn('\nTo build and deploy your contract, use the following commands instead:\n');
    console.warn(chalk`{magenta archway build --optimized}`);
    console.warn(chalk`{magenta archway store}`);
    console.warn(chalk`{magenta archway instantiate}`);
    console.warn(chalk`{magenta archway metadata}`);
    console.warn('\n');

    await deploy(archwayd, options);
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
