#!/usr/bin/env node

// const Dotenv = require('dotenv').config();
const Tools = require(__dirname + '/util');
const FileSystem = require('fs');
const { Command } = require('commander');
const Program = new Command();
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
  .option('-k, --docker <value>', 'Use the docker version of archway daemon, e.g. "--docker true" or "-k false"')
  .action(async (options) => {
    let add = (options.add) ? true : false;
    let docker = (options.docker) ? options.docker.toLowerCase() : false;
    if (typeof docker == 'string') {
      if (docker == 'true')
        docker = true;
      if (docker == 'false')
        docker = false;
      // List accounts
      if (!add) {
        await Tools.Accounts(docker);
        // Add new account
      } else {
        let name = options.add;
        await Tools.Accounts(docker, true, name);
      }
    } else {
      // Load Docker value from config, or use native `archwayd`
      try {
        let configPath = await ConfigTools.path();
        FileSystem.access(configPath, FileSystem.F_OK, async (err) => {
          if (!err) {
            let config = require(configPath);
            if (config.developer.archwayd.docker) {
              docker = true;
            }
          }
          // List accounts
          if (!add) {
            await Tools.Accounts(docker);
            // Add new account
          } else {
            let name = options.add;
            await Tools.Accounts(docker, true, name);
          }
        });
      } catch (e) {
        // No Docker
        await Tools.Accounts(false);
      }
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
  .option('-k, --docker <value>', 'Use the docker version of archway daemon, e.g. "--docker true" or "-k false"')
  .action(async (options) => {
    let dryrun = (options.dryrun) ? true : false;
    let args = (options.args) ? options.args : null;
    let docker = (options.docker) ? options.docker.toLowerCase() : false;
    if (typeof docker == 'string') {
      if (docker == 'true')
        docker = true;
      if (docker == 'false')
        docker = false;

      if (!dryrun) {
        await Tools.Deploy(docker, args);
      } else {
        await Tools.Deploy(docker, args, dryrun);
      }
    } else {
      let configPath = await ConfigTools.path();
      FileSystem.access(configPath, FileSystem.F_OK, async (err) => {
        if (!err) {
          let config = require(configPath);
          if (config.developer.archwayd.docker) {
            docker = true;
          }
        }
        if (!dryrun) {
          await Tools.Deploy(docker, args);
        } else {
          await Tools.Deploy(docker, args, dryrun);
        }
      });
    }
  });

// `archway faucet`
Program
  .command('faucet')
  .description('Request Testnet funds from faucet')
  .option('-k, --docker <value>', 'Use the docker version of archway daemon keyring, e.g. "--docker true" or "-k false"')
  .option('-t, --testnet <value>', 'Testnet to request from; "constantine" or "titus" (default: "constantine")')
  .action(async (options) => {
    let docker = (options.docker) ? options.docker.toLowerCase() : true; // XXX: Default true for now
    let testnet = (options.testnet) ? options.testnet : "constantine";
    if (typeof docker == 'string') {
      docker = Boolean(docker);
    }
    await Tools.Faucet(docker, testnet);
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
    await Tools.Network(docker, testnet);
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
  .option('-k, --docker <value>', 'Use the docker version of archway daemon, e.g. "--docker true" or "-k false"')
  .description('Query for data on Archway network')
  .action(async (module, type, options) => {
    let docker = (options.docker) ? options.docker.toLowerCase() : false;
    const args = {
      command: module,
      subcommand: type,
      query: (options.args) ? options.args : null,
      flags: (options.flags) ? options.flags : null
    };
    if (typeof docker == 'string') {
      if (docker == 'true')
        docker = true;
      if (docker == 'false')
        docker = false;

      await Tools.Query(docker, args);
    } else {
      let configPath = await ConfigTools.path();
      FileSystem.access(configPath, FileSystem.F_OK, async (err) => {
        if (!err) {
          let config = require(configPath);
          if (config.developer.archwayd.docker) {
            docker = true;
          }
        }
        await Tools.Query(docker, args);
      });
    }
  });

// `archway script`
Program
  .command('run')
  .description('Run a custom script of your own creation')
  .requiredOption('-s, --script <key>', 'Name of script to run (example: "archway run -s build"); add scripts by modifying config.json')
  .option('-k, --docker <value>', 'Use the docker version of archway daemon, e.g. "--docker true" or "-k false"')
  .action(async (options) => {
    let docker = (options.docker) ? options.docker.toLowerCase() : false;
    if (typeof docker == 'string') {
      if (docker == 'true')
        docker = true;
      if (docker == 'false')
        docker = false;

      try {
        await Tools.Script(docker, options.script);
      } catch (e) {
        console.error('Error running custom script', [options.script]);
      }
    } else {
      let configPath = await ConfigTools.path();
      FileSystem.access(configPath, FileSystem.F_OK, async (err) => {
        if (!err) {
          let config = require(configPath);
          if (config.developer.archwayd.docker) {
            docker = true;
          }
          try {
            await Tools.Script(docker, options.script);
          } catch (e) {
            console.error('Error running custom script', [options.script]);
          }
        }
      });
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
  .option('-k, --docker <value>', 'Use the docker version of archway daemon, e.g. "--docker true" or "-k false"')
  .description('Execute a transaction on Archway network')
  .action(async (options) => {
    let docker = (options.docker) ? options.docker.toLowerCase() : false;
    const args = {
      tx: (options.args) ? options.args : null,
      flags: (options.flags) ? options.flags : null,
      contract: (options.contract) ? options.contract : null
    };
    if (typeof docker == 'string') {
      if (docker == 'true')
        docker = true;
      if (docker == 'false')
        docker = false;

      await Tools.Tx(docker, args);
    } else {
      let configPath = await ConfigTools.path();
      FileSystem.access(configPath, FileSystem.F_OK, async (err) => {
        if (!err) {
          let config = require(configPath);
          if (config.developer.archwayd.docker) {
            docker = true;
          }
        }
        await Tools.Tx(docker, args);
      });
    }
  });

// Do cmd parsing
Program.parse(process.argv);
