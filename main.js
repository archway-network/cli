#!/usr/bin/env node

// const Dotenv = require('dotenv').config();
const Tools = require(__dirname + '/util');
const { Command } = require('commander');
const Program = new Command();

/**
 * CLI worker
 * @see commander (https://www.npmjs.com/package/commander)
 */
Program.version('Archway dApp developer CLI\nv0.0.1', '-v, --version', 'output the current version');

// Commands
// `archway accounts`
Program
  .command('accounts')
  .description('List available wallets or add new wallet')
  .option('-a, --add <label>', 'Add a new wallet')
  .action(async (options) => {
    let add = (options.add) ? true : false;
    // List accounts
    if (!add) {
      await Tools.Accounts();
    // Add new account
    } else {
      let name = options.add;
      await Tools.Accounts(true, name);
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
    .description('Print or modify developer environment settings')
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
    .description('Deploy dApp to network, or test deployability')
    .option('-a, --args', 'JSON encoded constructor arguments for contract deployment, e.g. --args \'{"key":"value"}\'')
    .option('-d, --dryrun', 'Test deployability; builds an unoptimized wasm binary')
    .action(async (options) => {
      let dryrun = (options.dryrun) ? true : false;
      if (!dryrun) {
        await Tools.Deploy();
      } else {
        await Tools.Deploy(true);
      }
    });

  // `archway faucet`
  Program
    .command('faucet')
    .description('Request Testnet funds from faucet')
    .action(async () => {
      await Tools.Faucet();
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
    .description('Create a new dApp project for Archway Network')
    .action(async () => {
      await Tools.New();
    });
  
  // `archway query`
  
  // `archway script`
  Program
    .command('run')
    .description('Run a custom script of your own creation')
    .requiredOption('-s, --script <key>', 'Name of script to run (example: "archway run -s build"); add scripts by modifying config.json')
    .action(async (options) => {
      try {
        await Tools.Script(options.script);
      } catch(e) {
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

// Do cmd parsing
Program.parse(process.argv);