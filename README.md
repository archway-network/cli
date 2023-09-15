# Archway Developer CLI

[![Archway CLI](https://img.shields.io/badge/cli-archway-brightgreen.svg)](https://docs.archway.io)
[![Version](https://img.shields.io/npm/v/@archwayhq/cli)](https://www.npmjs.com/package/@archwayhq/cli)
[![Downloads/Week](https://img.shields.io/npm/dw/@archwayhq/cli.svg)](https://npmjs.org/package/@archwayhq/cli)
![Tests](https://github.com/archway-network/archway-cli/actions/workflows/test.yml/badge.svg)
![CodeQL](https://github.com/archway-network/archway-cli/actions/workflows/codeql.yml/badge.svg)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/070b358e0ece44c2b45867d945c46a28)](https://app.codacy.com/gh/archway-network/archway-cli/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![License](https://img.shields.io/github/license/archway-network/archway-cli?label=License&logo=opensourceinitiative&logoColor=white&color=informational)](https://opensource.org/licenses/Apache-2.0)

Develop WASM smart contracts with the Archway Network's Developer CLI.

## Dependencies

Make sure you've installed and configured all dependencies. For the full
installation and setup instructions, [visit the docs](https://docs.archway.io/developers/getting-started/install).

- [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm "Install Node.js and NPM")
- [cargo](https://doc.rust-lang.org/cargo/getting-started/installation.html "Install Cargo")
- [cargo-generate](https://crates.io/crates/cargo-generate "Install Cargo Generate")
- [docker](https://docs.docker.com/get-docker "Install Docker")

If you are on a Linux machine with a distribution different from Ubuntu, you may
need to install the [GNOME Keyring](https://wiki.archlinux.org/title/GNOME/Keyring),
or any other keyring compatible with the [Secret service API](https://www.gnu.org/software/emacs/manual/html_node/auth/Secret-Service-API.html).

## CLI Installation

### Install the latest published version

```bash
npm i -g @archwayhq/cli
```

or

```bash
yarn global add @archwayhq/cli
```

### Install the pre-release version

```bash
npm i -g @archwayhq/cli@pre
```

or

```bash
yarn global add @archwayhq/cli@pre
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

```bash
archway [command] [options]
```

### Commands

```console
$ archway help

new                                Initializes a new project repository

accounts new [options]             Adds a new wallet to the keyring
accounts get [options]             Displays details about an account
accounts list [options]            Lists all accounts in the keyring
accounts remove [options]          Removes an account from the keyring
accounts balances get [options]    Query the balance of an address or account
accounts balances send [options]   Send tokens from an address or account to another
accounts balances [options]        Manage the token balance of an account

config init [options]              Initializes a config file for the current project
config show [options]              Displays the config values for the current project
config deployments [options]       Displays the list of deployments, allows filtering by chain, action and contract
config chains use [options]        Switches the current chain in use and updates the config file appropriately
config chains import [options]     Import a chain registry file and save it to the global configuration
config chain-id [options]          Query or update the 'chain-id' in the config file (local or global)
config contracts-path [options]    Query or update the 'contracts-path' in the config file (local or global)
config default-account [options]   Query or update the 'default-account' in the config file (local or global)
config keyring-backend [options]   Query or update the 'keyring-backend' in the config file (local or global)
config keyring-path [options]      Query or update the 'keyring-path' in the config file (local or global)

contracts new [options]            Scaffolds a new Wasm smart contract from a template
contracts build [options]          Builds the smart contracts optimized Wasm file along with its schemas
contracts store [options]          Stores a Wasm file on-chain
contracts instantiate [options]    Instantiates code stored on-chain with the given arguments
contracts metadata [options]       Sets a smart contracts rewards metadata
contracts premium [options]        Sets the smart contract premium flat fee
contracts execute [options]        Executes a transaction in a smart contract
contracts migrate [options]        Runs a smart contract migration
contracts query balance [options]  Access the bank module to query the balance of smart contracts
contracts query smart [options]    Queries a single smart contract

rewards query [options]            Queries the outstanding rewards for a specific account or address
rewards withdraw [options]         Withdraws rewards for a specific account
```
