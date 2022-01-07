#!/usr/bin/env node

// const Dotenv = require('dotenv').config();
const Tools = require(__dirname + '/util');
const { Command, Option } = require('commander');
const Program = new Command();
const Commands = require('./constants/commands');
const ConfigTools = require('./constants/config');

/**
 * Gets semvar from ./package.json
 */
function getVersion() {
  const pkgJson = require('./package.json');
  let version = '';
  if (typeof pkgJson !== 'object')
    return version;
  else {
    version = (pkgJson['version']) ? pkgJson.version : '';
  }
  return version;
}

function getDockerFromConfig() {
  try {
    let config = ConfigTools.config();
    return config.developer.archwayd.docker;
  } catch (error) {
    return true;
  }
}

const DockerOption = new Option('-k, --docker', 'Use the docker version of archway daemon')
  .default(getDockerFromConfig());

/**
 * CLI worker
 * @see commander (https://www.npmjs.com/package/commander)
 */
Program.version('Archway dApp developer CLI\n' + getVersion(), '-v, --version', 'output the current version');

// Commands
// `archway accounts`
Program
  .command('accounts')
  .description('List available wallets or add new wallet')
  .option('-a, --add <label>', 'Add a new wallet')
  .addOption(DockerOption)
  .action(async (options) => {
    if (options.docker) {
      await Commands.checkHomePath();
    }

    if (options.add) {
      // Add new account
      let name = options.add;
      await Tools.Accounts(options.docker, true, name);
    } else {
      await Tools.Accounts(options.docker);
    }
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
  .option('-t, --testnet <value>', 'Testnet to request from; "constantine" or "titus" (default: "constantine")')
  .action(async (options) => {
    let testnet = (options.testnet) ? options.testnet : "constantine";

    if (options.docker) {
      await Commands.checkHomePath();
    }

    await Tools.Faucet(options.docker, testnet);
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
  .argument('[name]', 'project name')
  .action(async (name) => {
    await Tools.New(name);
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
Program.parse(process.argv);
