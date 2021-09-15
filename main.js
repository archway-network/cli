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
Program.parse(process.argv);