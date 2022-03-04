#!/usr/bin/env node

const _ = require('lodash');
const chalk = require('chalk');
const { Command, Option, InvalidArgumentError } = require('commander');
const Tools = require('./commands');
const Config = require('./util/config');
const { createClient } = require('./clients/archwayd');
const { Environments, Testnets } = require('./networks');
const { isJson, isProjectName, isArchwayAddress } = require('./util/validators');

/**
 * Gets the version from package.json
 */
function getVersion() {
  const { version } = require('../package.json');
  return version;
}

async function getDefaultsFromConfig() {
  try {
    const {
      network: { name: networkName } = {},
      developer: { archwayd: { docker = true, version: archwaydVersion = networkName } = {} } = {}
    } = await Config.read();
    return { archwaydVersion, docker };
  } catch (e) {
    return { docker: true };
  }
}

async function updateWithDockerOptions(options) {
  return await _.defaults(
    options,
    await getDefaultsFromConfig()
  );
}

const DockerOption = new Option('-k, --docker', 'Use the docker version of archwayd');

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
const Program = new Command();
Program.version(getVersion(), '-v, --version', 'output the current version');
Program.configureOutput({
  outputError: (str, write) => write(chalk.red(str))
});

// Commands
// `archway accounts`
Program
  .command('accounts')
  .description('List available wallets or add new wallet')
  .option('-a, --add <label>', 'Add a new wallet')
  .addOption(DockerOption)
  .action(async (options) => {
    options = await updateWithDockerOptions(options);
    const archwayd = await createClient({ checkHomePath: true, ...options });
    await Tools.Accounts(archwayd, options);
  });

// `archway build`
Program
  .command('build')
  .description('Build current project')
  .action(async () => {
    await Tools.Build();
  });

// `archway configure`
Program
  .command('configure')
  .description('Print or modify environment settings')
  .option('-m, --modify <key>', 'Modify a particular setting; command will fail if <key> does not yet exist.')
  .action(async (options) => {
    let modify = (options.modify) ? true : false;
    if (!modify) {
      await Tools.Configure();
    } else {
      let param = options.modify
      await Tools.Configure(true, param);
    }
  });

// `archway deploy`
Program
  .command('deploy')
  .description('Deploy to network, or test deployability')
  .option('-a, --args <value>', 'JSON encoded constructor arguments for contract deployment (e.g. --args \'{"key": "value"}\')', parseJson)
  .option('-f, --from <value>', 'Name or address of account to sign transactions')
  .option('-l, --label <value>', 'Label to use for instantiating the contract (default: "<project_name> <project_version>")')
  .option('--reward-address <value>', 'Address for the reward contract(e.g. "archway1...")', parseArchwayAddress)
  .option('-d, --dry-run', 'Tests deployability; builds an unoptimized wasm binary', false)
  .option('--no-confirm', 'Skip tx broadcasting prompt confirmation')
  .addOption(new Option('--dryrun', '[deprecated]').hideHelp())
  .addOption(DockerOption)
  .action(async ({ dryrun, ...options }) => {
    if (dryrun) {
      console.warn(chalk`{yellow [deprecated] --dryrun is deprecated. Use --dry-run instead.}`);
      options = { dryRun: dryrun, ...options };
    }

    options = await updateWithDockerOptions(options);
    const archwayd = await createClient({ checkHomePath: true, ...options });
    await Tools.Deploy(archwayd, options);
  });

// `archway faucet`
Program
  .command('faucet')
  .description('Request Testnet funds from faucet')
  .addOption(DockerOption)
  .addOption(
    new Option('-t, --testnet <value>', 'Testnet to request for funds')
      .choices(Testnets)
      .default([...Testnets].shift())
  )
  .argument('[address]', 'Address to request funds for (e.g. "archway1...")', parseArchwayAddress)
  .action(async (address, options) => {
    options = await updateWithDockerOptions(options);
    const archwayd = await createClient({ checkHomePath: true, ...options });
    await Tools.Faucet(archwayd, { address, ...options });
  });

// `archway history`
Program
  .command('history')
  .description('Print deployments history')
  .action(async () => {
    await Tools.DeployHistory();
  });

// `archway network`
Program
  .command('network')
  .description('Show network settings or migrate between networks')
  .action(async () => {
    await Tools.Network();
  });

// `archway new`
Program
  .command('new')
  .description('Create a new project for Archway network')
  .option('-k, --docker', 'Use the docker version of archwayd', true)
  .option('--no-docker', 'Use the binary version of archwayd')
  .addOption(new Option('-e, --environment <value>', 'Environment to use for the project').choices(Environments))
  .addOption(new Option('-t, --testnet <value>', 'Testnet to use for the project').choices(Testnets))
  .option('--template <value>', 'Project template to use')
  .addOption(new Option('--no-template', 'Do not prompt for a project template').preset('default'))
  .option('-b, --build', 'Build the project after setup', true)
  .option('--no-build', 'Do no build the project after setup')
  .argument('[name]', 'Project name', parseProjectName)
  .action(async (name, options) => {
    await Tools.New(name, options);
  });

// `archway query`
let modChoices = [
  'code',
  ' contract',
  ' contract-history',
  ' contract-state',
  ' list-code',
  ' list-contract-by-code'
];
let typeChoices = [
  'smart',
  ' code_id',
  ' all',
  ' raw'
];
Program
  .command('query')
  .argument('<module>', 'Query module to use; available modules: ' + String(modChoices))
  .argument('[type]', 'Subcommands (*if required by query module); available types: ' + String(typeChoices))
  .requiredOption('-a, --args <value>', 'JSON encoded arguments for query (e.g. \'{"get_count": {}}\')')
  .option('-f, --flags <flags>', 'Send additional flags to archwayd by wrapping in a string; e.g. "--height 492520 --limit 10"')
  .addOption(DockerOption)
  .description('Query for data on Archway network')
  .action(async (module, type, options) => {
    options = await updateWithDockerOptions(options);
    await createClient({ checkHomePath: true, ...options });

    const args = {
      command: module,
      subcommand: type,
      query: (options.args) ? options.args : null,
      flags: (options.flags) ? options.flags : null
    };

    await Tools.Query(options.docker, args);
  });

// `archway script`
Program
  .command('run')
  .description('Run a custom script of your own creation')
  .requiredOption('-s, --script <key>', 'Name of script to run (example: "archway run -s build"); add scripts by modifying config.json')
  .addOption(DockerOption)
  .action(async (options) => {
    options = await updateWithDockerOptions(options);
    await createClient({ checkHomePath: true, ...options });

    try {
      await Tools.Script(options.docker, options.script);
    } catch (e) {
      console.error('Error running custom script', [options.script]);
    }
  });

// `archway test`
Program
  .command('test')
  .description('Run unit tests')
  .action(async () => {
    await Tools.Test();
  });

// `archway tx`
Program
  .command('tx')
  .option('-a, --args <value>', 'JSON encoded arguments to execute in transaction; defaults to "{}"')
  .option('-f, --flags <flags>', 'Send additional flags to archwayd by wrapping in a string; e.g. "--dry-run --amount 1"')
  .option('-c, --contract <address>', 'Optional contract address override; defaults to last deployed')
  .addOption(DockerOption)
  .description('Execute a transaction on Archway network')
  .action(async (options) => {
    options = await updateWithDockerOptions(options);
    await createClient({ checkHomePath: true, ...options });

    const args = {
      tx: (options.args) ? options.args : null,
      flags: (options.flags) ? options.flags : null,
      contract: (options.contract) ? options.contract : null
    };

    await Tools.Tx(options.docker, args);
  });

const main = async () => await Program.parseAsync();

main();
