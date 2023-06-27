#!/usr/bin/env node

const _ = require('lodash');
const chalk = require('chalk');
const { Command, Option, CommanderError, InvalidArgumentError } = require('commander');
const Tools = require('./commands');
const { Config } = require('./util/config');
const { PromptCancelledError } = require('./util/prompts');
const { createClient, ArchwayClientError, TransactionCancelledError } = require('./clients/archwayd');
const { Environments, Testnets } = require('./networks');
const { isJson, isProjectName, isArchwayAddress } = require('./util/validators');
const { checkSemanticVersion } = require('./util/semvar');

/**
 * Gets the version from package.json
 */
function getVersion() {
  const { version } = require('../package.json');
  return version;
}

async function getDefaultsFromConfig() {
  try {
    const { network: { wasm: { archwayd: archwaydVersion } = {} } = {} } = await Config.read();
    return { archwaydVersion };
  } catch (e) {
    return {};
  }
}

async function updateWithDefaultsFromConfig(options) {
  return await _.defaults(options, await getDefaultsFromConfig());
}

function parseArchwayAddress(value) {
  if (!isArchwayAddress(value)) {
    throw new InvalidArgumentError('Please inform a valid bech32 address.');
  }
  return value;
}

function parseProjectName(value) {
  if (!isProjectName(value)) {
    throw new InvalidArgumentError('Please inform a valid project name, like <project-name> or <project_name>.');
  }
  return value;
}

function parseJson(value) {
  if (!isJson(value)) {
    throw new InvalidArgumentError('Please inform a valid JSON string.');
  }
  return value;
}

/**
 * CLI worker
 * @see commander (https://www.npmjs.com/package/commander)
 */
const program = new Command()
  .version(getVersion(), '-v, --version', 'output the current version')
  .configureOutput({
    outputError: (str, write) => write(chalk.red(str)),
  })
  .exitOverride();

program
  .command('accounts')
  .description('List available wallets or add new wallet')
  .option('-a, --add <label>', 'Add a new wallet')
  .action(async options => {
    options = await updateWithDefaultsFromConfig(options);
    const archwayd = await createClient(options);
    await Tools.Accounts(archwayd, options);
  });

program
  .command('build')
  .alias('buidl')
  .description('Build the project')
  .option('-o, --optimize', 'Builds an optimized wasm file ready for deployment')
  .action(async options => {
    await Tools.Build(options);
  });

program
  .command('config')
  .description('Print or create a config file')
  .option('-i, --init', 'Initializes a config file for the current project')
  .action(async options => {
    await Tools.Config(options);
  });

program
  .command('instantiate')
  .description('Instantiate a stored contract')
  .option('-c, --code-id <value>', 'Code ID for the WASM stored on-chain', parseInt)
  .option(
    '-a, --args <value>',
    'JSON encoded constructor arguments for contract deployment (e.g. --args \'{ "count": 0 }\')',
    parseJson
  )
  .option('-l, --label <value>', 'Label used for instantiating the contract')
  .option('--default-label', 'Use the default label for instantiating the contract: "<project_name> <project_version>"')
  .option('-f, --from <value>', 'Name or address of account to sign the transactions')
  .option(
    '--admin-address <value>',
    'Address which can perform admin actions on the contract (e.g. "archway1...")',
    parseArchwayAddress
  )
  .option('--no-confirm', 'Skip tx broadcasting prompt confirmation')
  .action(async options => {
    options = await updateWithDefaultsFromConfig(options);
    const archwayd = await createClient(options);
    await Tools.Instantiate(archwayd, options);
  });

program
  .command('deploy')
  .description('Deploy to network, or test deployability')
  .option(
    '-a, --args <value>',
    'JSON encoded constructor arguments for contract deployment (e.g. --args \'{ "count": 0 }\')',
    parseJson
  )
  .option('-l, --label <value>', 'Label used for instantiating the contract')
  .option('--default-label', 'Use the default label for instantiating the contract: "<project_name> <project_version>"')
  .option('-f, --from <value>', 'Name or address of account to sign the transactions')
  .option(
    '--admin-address <value>',
    'Address which can perform admin actions on the contract (e.g. "archway1...")',
    parseArchwayAddress
  )
  .option(
    '--no-build',
    'Do not build the project before deploying; it will fail in case the wasm file is not built',
    true
  )
  .option('--no-store', 'Do not upload the wasm file on-chain (uses the latest version on config.json)', true)
  .option('--no-verify', 'Do not verify the wasm file uploaded on-chain', true)
  .option('--no-confirm', 'Skip tx broadcasting prompt confirmation')
  .action(async options => {
    options = await updateWithDefaultsFromConfig(options);
    const archwayd = await createClient(options);
    await Tools.Deploy(archwayd, options);
  });

program
  .command('faucet', { hidden: true })
  .description('Request Testnet funds from faucet')
  .addOption(
    new Option('-t, --testnet <value>', 'Testnet to request for funds').choices(Testnets).default([...Testnets].shift())
  )
  .argument('[address]', 'Address to request funds for (e.g. "archway1...")', parseArchwayAddress)
  .action(address => {
    console.info('To request funds from the faucet you should use our Discord channel.\n');
    console.info(chalk`1. Join our Discord server at {blue https://discord.gg/dnYYcKPAX5}`);
    console.info(chalk`2. Send the following message in the {yellow 🚰｜faucet} channel\n`);
    console.info(chalk`{bold.white !faucet ${address || '<address>'}}\n`);
    console.info('The funds will be deposited to your account in a few minutes on all testnets.');
  });

program
  .command('history')
  .description('Print deployments history for the currently selected network')
  .option('-a, --all', 'Print all deployments history')
  .action(async options => {
    await Tools.DeployHistory(options);
  });

program
  .command('metadata')
  .description('Sets the contract metadata with rewards parameters')
  .option('-c, --contract <address>', 'Optional contract address; defaults to the last deployed contract')
  .option('-f, --from <value>', 'Name or address of account to sign transactions')
  .option(
    '--owner-address <value>',
    'Contract owner address which can change the metadata later on (e.g. "archway1...")',
    parseArchwayAddress
  )
  .option(
    '--rewards-address <value>',
    'Address that will receive the rewards (e.g. "archway1...")',
    parseArchwayAddress
  )
  .option('--no-confirm', 'Skip tx broadcasting prompt confirmation')
  .option('--flags <flags...>', 'Send additional flags to archwayd (e.g.: --flags --amount 1)')
  .action(async options => {
    options = await updateWithDefaultsFromConfig(options);
    const archwayd = await createClient(options);
    await Tools.Metadata(archwayd, options);
  });

program
  .command('network')
  .description('Show network settings or migrate between networks')
  .addOption(new Option('-m, --migrate', 'Migrates the project to another network'))
  .addOption(new Option('-e, --environment <value>', 'Environment to use for the project').choices(Environments))
  .addOption(new Option('-t, --testnet <value>', 'Testnet to use for the project').choices(Testnets))
  .action(async options => {
    await Tools.Network(options);
  });

program
  .command('new')
  .description('Create a new project for Archway network')
  .addOption(new Option('-e, --environment <value>', 'Environment to use for the project').choices(Environments))
  .addOption(new Option('-t, --testnet <value>', 'Testnet to use for the project').choices(Testnets))
  .option('--template <value>', 'Project template to use')
  .addOption(new Option('--no-template', 'Do not prompt for a project template').preset('default'))
  .option('--build', 'Build the project after setup')
  .argument('[name]', 'Project name', parseProjectName)
  .action(async (name, options) => {
    await Tools.New(name, options);
  });

let modChoices = ['code', 'contract', 'contract-history', 'contract-state', 'list-code', 'list-contract-by-code'];
let typeChoices = ['smart', 'code_id', 'all', 'raw'];
program
  .command('query')
  .alias('q')
  .argument('<module>', 'Query module to use; available modules: ' + String(modChoices))
  .argument('[type]', 'Subcommands (*if required by query module); available types: ' + String(typeChoices))
  .requiredOption('-a, --args <value>', 'JSON encoded arguments for query (e.g. \'{"get_count": {}}\')')
  .option(
    '-f, --flags <flags>',
    'Send additional flags to archwayd by wrapping in a string; e.g. "--height 492520 --limit 10"'
  )
  .option(
    '-c, --contract <contract_address>',
    'Query a specific contract address; e.g "--contract archway1..."',
    parseArchwayAddress
  )
  .option('--raw', 'Prints the query response as raw JSON')
  .description('Query for data on Archway network')
  .action(async (module, type, options) => {
    options = await updateWithDefaultsFromConfig(options);
    const archwayd = await createClient(options);
    await Tools.Query(archwayd, { module, type, options });
  });

program
  .command('store')
  .description('Stores and verify a contract on-chain')
  .option('-f, --from <value>', 'Name or address of account to sign the transactions')
  .option('--no-store', 'Do not upload the wasm file on-chain (uses the latest version on config.json)', true)
  .option('--no-verify', 'Do not verify the wasm file uploaded on-chain', true)
  .option('--no-confirm', 'Skip tx broadcasting prompt confirmation')
  .action(async options => {
    options = await updateWithDefaultsFromConfig(options);
    const archwayd = await createClient(options);
    await Tools.Store(archwayd, options);
  });

program
  .command('tx')
  .option('-c, --contract <address>', 'Optional contract address override; defaults to last deployed')
  .option('-f, --from <value>', 'Name or address of account to sign transactions')
  .option('-a, --args <value>', 'JSON encoded arguments to execute in transaction; defaults to "{}"')
  .option('--no-confirm', 'Skip tx broadcasting prompt confirmation')
  .option('--flags <flags...>', 'Send additional flags to archwayd (e.g.: --flags --amount 1)')
  .description('Execute a smart contract transaction on Archway network')
  .action(async options => {
    options = await updateWithDefaultsFromConfig(options);
    const archwayd = await createClient(options);
    await Tools.Tx(archwayd, options);
  });

program.hook('postAction', async () => {
  const skipVersionCheck = process.env.ARCHWAY_SKIP_VERSION_CHECK || 0;
  if (skipVersionCheck.toString().toLowerCase() === 'true' || parseInt(skipVersionCheck) === 1) {
    return;
  }
  await checkSemanticVersion();
});

async function run() {
  try {
    await program.parseAsync();
  } catch (e) {
    if (e instanceof CommanderError || e instanceof PromptCancelledError || e instanceof TransactionCancelledError) {
      return;
    }

    if (e instanceof ArchwayClientError) {
      console.error(e.toString());
    } else {
      console.error(e);
    }

    process.exitCode = 1;
  }
}

run();
