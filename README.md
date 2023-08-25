Archway CLI
=================

[![oclif](https://img.shields.io/badge/cli-archway-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@archwayhq/cli.svg)](https://npmjs.org/package/@archwayhq/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@archwayhq/cli.svg)](https://npmjs.org/package/@archwayhq/cli)
[![License](https://img.shields.io/npm/l/@archwayhq/cli.svg)](https://github.com/archway-network/archway-cli/blob/main/package.json)

## Dependencies

- [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm "Install Node.js and NPM")
- [cargo](https://doc.rust-lang.org/cargo/getting-started/installation.html "Install Cargo")
- [cargo-generate](https://crates.io/crates/cargo-generate "Install Cargo Generate")
- [docker](https://docs.docker.com/get-docker "Install Docker")

## CLI Installation

### Install the latest published version

```bash
npm i -g @archwayhq/cli
```

or

```bash
yarn global add @archwayhq/cli
```

### Install the development version

```bash
npm i -g 'github:archway-network/archway-cli'
```

or

```bash
yarn global add 'github:archway-network/archway-cli'
```

## Usage

```
archway [command] [options]
```

### Commands

```
new                      Initializes a new project repository

accounts new [options]             Adds a new wallet to the keystore
accounts get [options]             Displays details about an account
accounts list [options]            Lists all accounts in the keyring
accounts remove [options]          Removes an account from the keystore
accounts balances get [options]    Query the balance of an address or account
accounts balances send [options]   Send tokens from an address or account to another
accounts balances [options]        Manage the balances of an account.

config init [options]              Initializes a config file for the current project.
config show [options]              Shows the config file for the current project.
config deployments [options]       Displays the list of deployments, allows filtering by chain, action and contract.
config chains use [options]        Switches the current chain in use and updates the archway-cli.json config file with his information.
config chains export [options]     Exports a built-in chain registry file to {project-root}/.archway-cli/chains/{chain-id}.json.
config chains import [options]     Import a chain registry file and save it to {project-root}/.archway-cli/chains/{chain-id}.json.
config chains [options]            Chain management commands. The chain files follow the Cosmos chain registry schema.

contracts new [options]            Scaffolds a new Smart Contract from a template
contracts build [options]          Builds the contract's optimized WASM file, and its schemas
contracts store [options]          Stores a WASM file on-chain
contracts instantiate [options]    Instantiates code stored on-chain with the given arguments
contracts metadata [options]       Sets a contract rewards metadata
contracts premium [options]        Sets a contract premium flat fee for a contract
contracts execute [options]        Executes a transaction in a contract
contracts migrate [options]        Runs a contract migration
contracts query balance [options]  Access the bank module to query the balance of contracts
contracts query smart [options]    Queries a single smart contract
contracts query [options]          Display help for the contracts query command.

rewards query [options]            Queries the outstanding rewards for a specific account or address
rewards withdraw [options]         Withdraws rewards for a specific account
```
