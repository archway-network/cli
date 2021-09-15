#!/usr/bin/env node

const Dotenv = require('dotenv').config();
const Tools = require(__dirname + '/util');
const { Command } = require('commander');
const Program = new Command();

// Config parser
let config;
if (Dotenv.error) {
  throw Dotenv.error
} else {
  config = Dotenv.parsed;
}

/**
 * CLI worker
 * @see commander (https://www.npmjs.com/package/commander)
 */
Program.version('Archway dApp developer CLI\nv0.0.1', '-v, --version', 'output the current version');

// Commands
// `archway accounts`
Program
  .command('accounts')
  .description('List available wasmd accounts or add new account')
  .option('-a, --add <label>', 'Add a new wasmd account')
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

  // `archway configure`
  
  // `archway deploy`
  
  // `archway network`
  
  // `archway new`
  
  // `archway query`
  
  // `archway test`
  
  // `archway tx`

// Do cmd parsing
Program.parse(process.argv);