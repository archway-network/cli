#!/usr/bin/env node

const _ = require('lodash');
const { Command, Option, InvalidArgumentError } = require('commander');
const Tools = require('./commands');
const Commands = require('./constants/commands');
const ConfigTools = require('./constants/config');
const { createClient } = require('./clients/archwayd');
const { Environments, Testnets } = require('./networks');
const { isArchwayAddress } = require('./util/validators');

/**
 * Gets the version from package.json
 */
function getVersion() {
  const { version } = require('../package.json');
  return version;
}

function getDockerFromConfig() {
  try {
    let config = ConfigTools.config();
    return _.get(config, 'developer.archwayd.docker', true);
  } catch (error) {
    return true;
  }
}

const DockerOption = new Option('-k, --docker', 'Use the docker version of archwayd')
  .default(getDockerFromConfig());

function parseArchwayAddress(value) {
  if (!isArchwayAddress(value)) {
    throw new InvalidArgumentError('Please inform a valid bech32 address.');
  }
  return value;
}

/**
 * CLI worker
 * @see commander (https://www.npmjs.com/package/commander)
 */
const Program = new Command();
Program.version(getVersion(), '-v, --version', 'output the current version');

// Commands
// `archway accounts`
Program
  .command('accounts')
  .description('List available wallets or add new wallet')
  .option('-a, --add <label>', 'Add a new wallet')
  .addOption(DockerOption)
  .action(async (options) => {
    let client = await createClient({ checkHomePath: true, ...options });
    await Tools.Accounts(client, options);
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
  .option('-a, --args <value>', 'JSON encoded constructor arguments for contract deployment, e.g. --args \'{"key":"value"}\'')
  .option('-d, --dryrun', 'Test deployability; builds an unoptimized wasm binary')
  .addOption(DockerOption)
  .action(async (options) => {
    let dryrun = (options.dryrun) ? true : false;
    let args = (options.args) ? options.args : null;

    if (options.docker) {
      await Commands.checkHomePath();
    }

    if (!dryrun) {
      await Tools.Deploy(options.docker, args);
    } else {
      await Tools.Deploy(options.docker, args, dryrun);
    }
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
  .argument('[address]', 'Address to request funds for in the format "archway1..."', parseArchwayAddress)
  .action(async (address, options) => {
    let client = await createClient({ checkHomePath: true, ...options });
    await Tools.Faucet(client, { address, ...options });
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
  .argument('[name]', 'Project name')
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
    if (options.docker) {
      await Commands.checkHomePath();
    }

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
    if (options.docker) {
      await Commands.checkHomePath();
    }

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
    if (options.docker) {
      await Commands.checkHomePath();
    }

    const args = {
      tx: (options.args) ? options.args : null,
      flags: (options.flags) ? options.flags : null,
      contract: (options.contract) ? options.contract : null
    };

    await Tools.Tx(options.docker, args);
  });

// Do cmd parsing
Program.parse();
