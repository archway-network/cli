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

## Commands

<!-- commands -->
* [`archway accounts balances get ACCOUNT`](#archway-accounts-balances-get-account)
* [`archway accounts balances send AMOUNT`](#archway-accounts-balances-send-amount)
* [`archway accounts export ACCOUNT`](#archway-accounts-export-account)
* [`archway accounts get ACCOUNT`](#archway-accounts-get-account)
* [`archway accounts list`](#archway-accounts-list)
* [`archway accounts new [ACCOUNT-NAME]`](#archway-accounts-new-account-name)
* [`archway accounts remove ACCOUNT`](#archway-accounts-remove-account)
* [`archway autocomplete [SHELL]`](#archway-autocomplete-shell)
* [`archway config chains import [FILE]`](#archway-config-chains-import-file)
* [`archway config chains list`](#archway-config-chains-list)
* [`archway config chains use CHAIN`](#archway-config-chains-use-chain)
* [`archway config deployments`](#archway-config-deployments)
* [`archway config get KEY`](#archway-config-get-key)
* [`archway config init`](#archway-config-init)
* [`archway config set KEY VALUE`](#archway-config-set-key-value)
* [`archway config show`](#archway-config-show)
* [`archway contracts build [CONTRACT]`](#archway-contracts-build-contract)
* [`archway contracts execute CONTRACT`](#archway-contracts-execute-contract)
* [`archway contracts instantiate [CONTRACT]`](#archway-contracts-instantiate-contract)
* [`archway contracts metadata CONTRACT`](#archway-contracts-metadata-contract)
* [`archway contracts migrate CONTRACT`](#archway-contracts-migrate-contract)
* [`archway contracts new [CONTRACT-NAME]`](#archway-contracts-new-contract-name)
* [`archway contracts premium CONTRACT`](#archway-contracts-premium-contract)
* [`archway contracts query balance [CONTRACT]`](#archway-contracts-query-balance-contract)
* [`archway contracts query smart CONTRACT`](#archway-contracts-query-smart-contract)
* [`archway contracts store CONTRACT`](#archway-contracts-store-contract)
* [`archway help [COMMANDS]`](#archway-help-commands)
* [`archway new [PROJECT-NAME]`](#archway-new-project-name)
* [`archway rewards query ACCOUNT`](#archway-rewards-query-account)
* [`archway rewards withdraw`](#archway-rewards-withdraw)

## `archway accounts balances get ACCOUNT`

Query the balance of an address or account

```
Usage:
  $ archway accounts balances get ACCOUNT [--json] [--log-level debug|error|info|warn] [--keyring-backend file|os|test]
    [--keyring-path <value>]

Arguments:
  ACCOUNT  (required) Name of the key/account OR a valid bech32 address

Keyring Flags:
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: file|os|test>
  --keyring-path=<value>      File-based keyring path

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Query balance of an account

    $ archway accounts balances get alice

  Query balance of an address

    $ archway accounts balances get archway13lq4qvmydry3p394jrrfuv2z5xemzdnsplqdrm
```

_See code: [src/commands/accounts/balances/get.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/accounts/balances/get.ts)_

## `archway accounts balances send AMOUNT`

Send tokens from one address or account to another

```
Usage:
  $ archway accounts balances send AMOUNT --to <value> [--json] [--log-level debug|error|info|warn] [--keyring-backend
    file|os|test] [--keyring-path <value>] [-f <value>] [--fee <value>] [--no-confirm] [--gas-adjustment <value>]

Arguments:
  AMOUNT  (required) Token amount

REQUIRED Flags:
  --to=<value>  (required) Destination of the funds

Flags:
  --no-confirm  Don't show confirmation prompt

Keyring Flags:
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: file|os|test>
  --keyring-path=<value>      File-based keyring path

Transaction Flags:
  -f, --from=<value>        Signer of the tx
  --fee=<value>             Extra fees to pay along with the transaction
  --gas-adjustment=<value>  [default: 1.3] Multiplier that is applied to the default estimated gas to avoid running out
                            of gas exceptions

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Send tokens to an address

    $ archway accounts balances send 1aconst --to "archway1dstndnaelj95ksruudc2ww4s9epn8m59xft7jz"

  Transfger tokens between accounts in the keyring

    $ archway accounts balances send 1aconst --from alice --to bob
```

_See code: [src/commands/accounts/balances/send.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/accounts/balances/send.ts)_

## `archway accounts export ACCOUNT`

Exports an account's private key from the keyring

```
Usage:
  $ archway accounts export ACCOUNT [--json] [--log-level debug|error|info|warn] [--no-confirm] [--keyring-backend
    file|os|test] [--keyring-path <value>]

Arguments:
  ACCOUNT  (required) Name of the key/account OR a valid bech32 address

Flags:
  --no-confirm  Don't show confirmation prompt

Keyring Flags:
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: file|os|test>
  --keyring-path=<value>      File-based keyring path

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Export a private key

    $ archway accounts export alice

  Export a private key without confirmation prompt

    $ archway accounts export alice --no-confirm
```

_See code: [src/commands/accounts/export.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/accounts/export.ts)_

## `archway accounts get ACCOUNT`

Displays details about an account

```
Usage:
  $ archway accounts get ACCOUNT [--json] [--log-level debug|error|info|warn] [--address] [--keyring-backend
    file|os|test] [--keyring-path <value>]

Arguments:
  ACCOUNT  (required) Name of the key/account OR a valid bech32 address

Flags:
  --address  Display the address only

Keyring Flags:
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: file|os|test>
  --keyring-path=<value>      File-based keyring path

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Get all the details of an account

    $ archway accounts get alice

  Get the address only

    $ archway accounts get alice --address
```

_See code: [src/commands/accounts/get.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/accounts/get.ts)_

## `archway accounts list`

Lists all accounts in the keyring

```
Usage:
  $ archway accounts list [--json] [--log-level debug|error|info|warn] [--keyring-backend file|os|test]
    [--keyring-path <value>]

Keyring Flags:
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: file|os|test>
  --keyring-path=<value>      File-based keyring path

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  List all accounts

    $ archway accounts list
```

_See code: [src/commands/accounts/list.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/accounts/list.ts)_

## `archway accounts new [ACCOUNT-NAME]`

Adds a new wallet to the keyring

```
Usage:
  $ archway accounts new [ACCOUNT-NAME] [STDININPUT] [--json] [--log-level debug|error|info|warn] [--ledger |
    --recover] [--hd-path <value>] [--keyring-backend file|os|test] [--keyring-path <value>]

Arguments:
  ACCOUNT-NAME  Name of the key/account OR a valid bech32 address

Flags:
  --hd-path=<value>  [default: m/44'/118'/0'/0/0] HD Path of the account, following the BIP-44 standard
  --ledger           Add an account from a ledger device
  --recover          Enables the recovery of an account from a mnemonic or a private key

Keyring Flags:
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: file|os|test>
  --keyring-path=<value>      File-based keyring path

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Create a new account with a random mnemonic

    $ archway accounts new

  Create a new account with a random mnemonic and account name

    $ archway accounts new alice

  Create a new account with a random mnemonic and a custom HD path

    $ archway accounts new alice --hd-path "m/44'/60'/1'/0/0"

  Create a new account from a ledger device

    $ archway accounts new alice --ledger

  Create a new account from a ledger device and a custom HD path

    $ archway accounts new alice --ledger --hd-path "m/44'/118'/1'/0/0"

  Recover an account from a private key exported in unarmored hex format

    $ yes | archwayd keys export --unarmored-hex --unsafe alice | archway accounts new alice --recover

  Recover an account from a mnemonic

    $ echo "fruit rose..." | archway accounts new alice --recover

  Recover a Terra Station account from a mnemonic and custom HD path

    $ echo "fruit rose ..." | archway accounts new alice --recover --hd-path "m/44'/330'/0'/0/0"
```

_See code: [src/commands/accounts/new.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/accounts/new.ts)_

## `archway accounts remove ACCOUNT`

Removes an account from the keyring

```
Usage:
  $ archway accounts remove ACCOUNT [--json] [--log-level debug|error|info|warn] [--no-confirm] [--keyring-backend
    file|os|test] [--keyring-path <value>]

Arguments:
  ACCOUNT  (required) Name of the key/account OR a valid bech32 address

Flags:
  --no-confirm  Don't show confirmation prompt

Keyring Flags:
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: file|os|test>
  --keyring-path=<value>      File-based keyring path

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Remove an account

    $ archway accounts remove alice

  Remove an account without confirmation prompt

    $ archway accounts remove alice --no-confirm
```

_See code: [src/commands/accounts/remove.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/accounts/remove.ts)_

## `archway autocomplete [SHELL]`

display autocomplete installation instructions

```
Usage:
  $ archway autocomplete [SHELL] [-r]

Arguments:
  SHELL  (zsh|bash|powershell) Shell type

Flags:
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

Description:
  display autocomplete installation instructions

Examples:
  $ archway autocomplete

  $ archway autocomplete bash

  $ archway autocomplete zsh

  $ archway autocomplete powershell

  $ archway autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v2.3.10/src/commands/autocomplete/index.ts)_

## `archway config chains import [FILE]`

Import a chain registry file and save it to the global configuration

```
Usage:
  $ archway config chains import [FILE] [STDININPUT] [--json] [--log-level debug|error|info|warn] [-f]

Arguments:
  FILE  Path to file to be imported

Flags:
  -f, --force  Overwrite existing chain with the same id

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Import a chain from a spec file

    $ archway config chains import "other-chain.json"

  Overwrite an existing chain

    $ archway config chains import --force "other-chain.json"

  Import a chain from stdin

    $ cat other-chain.json | archway config chains import
```

_See code: [src/commands/config/chains/import.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/config/chains/import.ts)_

## `archway config chains list`

Lists all available chains to use

```
Usage:
  $ archway config chains list [--json] [--log-level debug|error|info|warn] [--columns <value> | -x] [--sort <value>]
    [--filter <value>] [--no-truncate | ] [--no-header | ]

Flags:
  -x, --extended     show extra columns
  --columns=<value>  only show provided columns (comma-separated)
  --filter=<value>   filter property by partial string matching, ex: name=foo
  --no-header        hide table header from output
  --no-truncate      do not truncate output to fit screen
  --sort=<value>     property to sort by (prepend '-' for descending)

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  $ archway config chains list
```

_See code: [src/commands/config/chains/list.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/config/chains/list.ts)_

## `archway config chains use CHAIN`

Switches the current chain in use and updates the config file appropriately

```
Usage:
  $ archway config chains use CHAIN [--json] [--log-level debug|error|info|warn] [-g]

Arguments:
  CHAIN  (required) ID of the chain

Flags:
  -g, --global  Sets the config in the global config file

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Select a chain for the local config

    $ archway config chains use constantine-3

  Select a chain for the global config

    $ archway config chains use constantine-3 --global
```

_See code: [src/commands/config/chains/use.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/config/chains/use.ts)_

## `archway config deployments`

Displays the list of deployments, allows filtering by chain, action and contract

```
Usage:
  $ archway config deployments [--json] [--log-level debug|error|info|warn] [--chain <value>] [--action
    instantiate|metadata|migrate|premium|store] [--contract <value>]

Flags:
  --action=<option>   Deployment action to filter by
                      <options: instantiate|metadata|migrate|premium|store>
  --chain=<value>     ID of the chain
  --contract=<value>  Contract name to filter by

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Query all the deployments in the project

    $ archway config deployments

  Filter deployments by chain id

    $ archway config deployments --chain "constantine-3"

  Filter deployments by action

    $ archway config deployments --action "store"

  Filter deployments by contract name

    $ archway config deployments --contract "my-contract"
```

_See code: [src/commands/config/deployments.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/config/deployments.ts)_

## `archway config get KEY`

Query config settings in the local or global config files

```
Usage:
  $ archway config get KEY [--json] [--log-level debug|error|info|warn] [-g]

Arguments:
  KEY  (required) (chain-id|contracts-path|default-account|keyring-backend|keyring-path) The config key to query

Flags:
  -g, --global  Sets the config in the global config file

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Query the default chain id in the local config

    $ archway config get chain-id

  Query the default keyring-backend in the global config

    $ archway config get -g chain-id
```

_See code: [src/commands/config/get.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/config/get.ts)_

## `archway config init`

Initializes a config file for the current project

```
Usage:
  $ archway config init [--json] [--log-level debug|error|info|warn] [--chain <value>]

Flags:
  --chain=<value>  ID of the chain

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Initialize a config file

    $ archway config init

  Initialize a config file with a chain id

    $ archway config init --chain="constantine-3"
```

_See code: [src/commands/config/init.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/config/init.ts)_

## `archway config set KEY VALUE`

Update config settings in the local or global config files

```
Usage:
  $ archway config set KEY VALUE [--json] [--log-level debug|error|info|warn] [-g]

Arguments:
  KEY    (required) (chain-id|contracts-path|default-account|keyring-backend|keyring-path) The config key to set
  VALUE  (required) The config value

Flags:
  -g, --global  Sets the config in the global config file

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Sets the default chain id in the global config

    $ archway config set -g chain-id archway-1

  Use the test keyring-backend in the current project

    $ archway config set keyring-backend test

  Update the path for the file keyring in the global config

    $ archway config set --global keyring-path "~/.keys"
```

_See code: [src/commands/config/set.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/config/set.ts)_

## `archway config show`

Displays the config values for the current project

```
Usage:
  $ archway config show [--json] [--log-level debug|error|info|warn]

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Display the config for the current project

    $ archway config show
```

_See code: [src/commands/config/show.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/config/show.ts)_

## `archway contracts build [CONTRACT]`

Builds the smart contracts optimized Wasm file along with its schemas

```
Usage:
  $ archway contracts build [CONTRACT] [--json] [--log-level debug|error|info|warn]

Arguments:
  CONTRACT  Name of the contract

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Build the optimized version of a contract, and generate the updated schemas

    $ archway contracts build my-contract
```

_See code: [src/commands/contracts/build.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/contracts/build.ts)_

## `archway contracts execute CONTRACT`

Executes a transaction in a smart contract

```
Usage:
  $ archway contracts execute CONTRACT [STDININPUT] [--json] [--log-level debug|error|info|warn] [--amount <value>]
    [--no-validation] [--args <value> | --args-file <value> | ] [--keyring-backend file|os|test] [--keyring-path
    <value>] [-f <value>] [--fee <value>] [--no-confirm] [--gas-adjustment <value>]

Arguments:
  CONTRACT  (required) Name of the contract

Flags:
  --amount=<value>     Funds to send to the contract on the transaction
  --args=<value>       JSON string with the message to send the smart contract
  --args-file=<value>  Path to a JSON file with a message to send to the smart contract
  --no-confirm         Don't show confirmation prompt
  --no-validation      Skip schema validation of the arguments

Keyring Flags:
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: file|os|test>
  --keyring-path=<value>      File-based keyring path

Transaction Flags:
  -f, --from=<value>        Signer of the tx
  --fee=<value>             Extra fees to pay along with the transaction
  --gas-adjustment=<value>  [default: 1.3] Multiplier that is applied to the default estimated gas to avoid running out
                            of gas exceptions

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Execute a transaction in a contract by contract name, with message from --args flag

    $ archway contracts execute my-contract --args '{"example":{}}'

  Execute a transaction in a contract by address, with message from --args flag

    $ archway contracts execute archway13lq4qvmydry3p394jrrfuv2z5xemzdnsplqdrm --args '{"example":{}}'

  Execute a transaction in a contract, from a specific account

    $ archway contracts execute my-contract --args '{"example":{}}' --from "alice"

  Execute a transaction in a contract by contract name, sending tokens with the transaction

    $ archway contracts execute my-contract --args '{"example":{}}' --amount "1const"

  Execute a transaction in a contract, with message from file

    $ archway contracts execute my-contract --args-file="./execMsg.json"

  Execute a transaction in a contract, with query message from stdin

    $ echo '{"example":{}}' | archway contracts execute my-contract
```

_See code: [src/commands/contracts/execute.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/contracts/execute.ts)_

## `archway contracts instantiate [CONTRACT]`

Instantiates code stored on-chain with the given arguments

```
Usage:
  $ archway contracts instantiate [CONTRACT] [STDININPUT] [--json] [--log-level debug|error|info|warn] [--admin <value>]
    [--no-admin] [--label <value>] [--code <value>] [--amount <value>] [--no-validation] [--args <value> | --args-file
    <value> | ] [--keyring-backend file|os|test] [--keyring-path <value>] [-f <value>] [--fee <value>] [--no-confirm]
    [--gas-adjustment <value>]

Arguments:
  CONTRACT  Name of the contract

Flags:
  --admin=<value>      Name of an account OR a valid bech32 address used as the contract admin
  --amount=<value>     Funds to send to the contract during instantiation
  --args=<value>       JSON string with the message to send the smart contract
  --args-file=<value>  Path to a JSON file with a message to send to the smart contract
  --code=<value>       Code stored
  --label=<value>      A human-readable name for this contract, displayed on explorers
  --no-admin           Instantiates the contract without an admin
  --no-confirm         Don't show confirmation prompt
  --no-validation      Skip schema validation of the arguments

Keyring Flags:
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: file|os|test>
  --keyring-path=<value>      File-based keyring path

Transaction Flags:
  -f, --from=<value>        Signer of the tx
  --fee=<value>             Extra fees to pay along with the transaction
  --gas-adjustment=<value>  [default: 1.3] Multiplier that is applied to the default estimated gas to avoid running out
                            of gas exceptions

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Instantiate a contract by contract name, with message from --args flag

    $ archway contracts instantiate my-contract --args '{"example":{}}'

  Instantiate a contract by code id, with message from --args flag

    $ archway contracts instantiate --code 10 --args '{"example":{}}'

  Instantiate a contract, from a specific account

    $ archway contracts instantiate my-contract --from "alice"

  Instantiate a contract, with a custom label

    $ archway contracts instantiate my-contract --args '{"example":{}}' --label "my-contract-v1.0.0"

  Instantiate a contract, sending tokens with the transaction

    $ archway contracts instantiate my-contract --args '{"example":{}}' --amount "1const"

  Instantiate a contract, with admin account different than the sender

    $ archway contracts instantiate my-contract --args '{"example":{}}' --admin \
      "archway1dstndnaelj95ksruudc2ww4s9epn8m59xft7jz"

  Instantiate a contract, with no admin

    $ archway contracts instantiate my-contract --args '{"example":{}}' --no-admin

  Instantiate a contract, with message from file

    $ archway contracts instantiate my-contract --args-file="./instMsg.json"

  Instantiate a contract, with query message from stdin

    $ echo '{"example":{}}' | archway contracts instantiate my-contract
```

_See code: [src/commands/contracts/instantiate.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/contracts/instantiate.ts)_

## `archway contracts metadata CONTRACT`

Sets a smart contracts rewards metadata

```
Usage:
  $ archway contracts metadata CONTRACT [--json] [--log-level debug|error|info|warn] [--owner-address <value>]
    [--rewards-address <value>] [--keyring-backend file|os|test] [--keyring-path <value>] [-f <value>] [--fee <value>]
    [--no-confirm] [--gas-adjustment <value>]

Arguments:
  CONTRACT  (required) Name of the contract

Flags:
  --no-confirm               Don't show confirmation prompt
  --owner-address=<value>    Owner of the contract metadata
  --rewards-address=<value>  Rewards destination address

Keyring Flags:
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: file|os|test>
  --keyring-path=<value>      File-based keyring path

Transaction Flags:
  -f, --from=<value>        Signer of the tx
  --fee=<value>             Extra fees to pay along with the transaction
  --gas-adjustment=<value>  [default: 1.3] Multiplier that is applied to the default estimated gas to avoid running out
                            of gas exceptions

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Set the rewards metadata, by contract name

    $ archway contracts metadata my-contract --owner-address "archway13lq4qvmydry3p394jrrfuv2z5xemzdnsplqdrm" \
      --rewards-address="archway13lq4qvmydry3p394jrrfuv2z5xemzdnsplqdrm"

  Set the rewards metadata, by address

    $ archway contracts metadata archway1dstndnaelj95ksruudc2ww4s9epn8m59xft7jz --owner-address \
      "archway13lq4qvmydry3p394jrrfuv2z5xemzdnsplqdrm" \
      --rewards-address="archway13lq4qvmydry3p394jrrfuv2z5xemzdnsplqdrm"

  Set the rewards metadata, from a specific account

    $ archway contracts metadata my-contract --owner-address "archway13lq4qvmydry3p394jrrfuv2z5xemzdnsplqdrm" \
      --rewards-address="archway13lq4qvmydry3p394jrrfuv2z5xemzdnsplqdrm" --from "alice"
```

_See code: [src/commands/contracts/metadata.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/contracts/metadata.ts)_

## `archway contracts migrate CONTRACT`

Runs a smart contract migration

```
Usage:
  $ archway contracts migrate CONTRACT [STDININPUT] --code <value> [--json] [--log-level debug|error|info|warn]
    [--no-validation] [--args <value> | --args-file <value> | ] [--keyring-backend file|os|test] [--keyring-path
    <value>] [-f <value>] [--fee <value>] [--no-confirm] [--gas-adjustment <value>]

Arguments:
  CONTRACT  (required) Name of the contract

REQUIRED Flags:
  --code=<value>  (required) Code id of the new version that will be migrated to

Flags:
  --args=<value>       JSON string with the message to send the smart contract
  --args-file=<value>  Path to a JSON file with a message to send to the smart contract
  --no-confirm         Don't show confirmation prompt
  --no-validation      Skip schema validation of the arguments

Keyring Flags:
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: file|os|test>
  --keyring-path=<value>      File-based keyring path

Transaction Flags:
  -f, --from=<value>        Signer of the tx
  --fee=<value>             Extra fees to pay along with the transaction
  --gas-adjustment=<value>  [default: 1.3] Multiplier that is applied to the default estimated gas to avoid running out
                            of gas exceptions

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Migrate a contract by contract name, with empty migrate message

    $ archway contracts migrate my-contract --code 21

  Migrate a contract, from a specific account

    $ archway contracts migrate my-contract --code 21 --from "alice"

  Migrate a contract, with message from --args flag

    $ archway contracts migrate my-contract --code 21 --args '{"example":{}}'

  Migrate a contract, with message from file

    $ archway contracts migrate my-contract --code 21 --args-file="./migrateMsg.json"

  Instantiate a contract, with message from stdin

    $ echo '{"example":{}}' | archway contracts migrate my-contract --code 21
```

_See code: [src/commands/contracts/migrate.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/contracts/migrate.ts)_

## `archway contracts new [CONTRACT-NAME]`

Scaffolds a new Wasm smart contract from a template

```
Usage:
  $ archway contracts new [CONTRACT-NAME] [--json] [--log-level debug|error|info|warn] [--template <value>]

Arguments:
  CONTRACT-NAME  Name of the contract

Flags:
  --template=<value>  Template name

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Create a new contract in the current project

    $ archway contracts new

  Create a new contract in the current project, with contract name

    $ archway contracts new --contract-name "other-contract"

  Create a new contract, with cw-20 template

    $ archway contracts new --contract-name="other-contract" --template="cw-20/base"

  Create a new contract, with increment template

    $ CARGO_GENERATE_VALUE_VERSION=full archway contracts new --contract-name="other-contract" \
      --template="increment"
```

_See code: [src/commands/contracts/new.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/contracts/new.ts)_

## `archway contracts premium CONTRACT`

Sets the smart contract's premium flat fee. The contract must have the rewards metadata already configured

```
Usage:
  $ archway contracts premium CONTRACT --premium-fee <value> [--json] [--log-level debug|error|info|warn]
    [--keyring-backend file|os|test] [--keyring-path <value>] [-f <value>] [--fee <value>] [--no-confirm]
    [--gas-adjustment <value>]

Arguments:
  CONTRACT  (required) Name of the contract

REQUIRED Flags:
  --premium-fee=<value>  (required) Token amount

Flags:
  --no-confirm  Don't show confirmation prompt

Keyring Flags:
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: file|os|test>
  --keyring-path=<value>      File-based keyring path

Transaction Flags:
  -f, --from=<value>        Signer of the tx
  --fee=<value>             Extra fees to pay along with the transaction
  --gas-adjustment=<value>  [default: 1.3] Multiplier that is applied to the default estimated gas to avoid running out
                            of gas exceptions

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Set the premium flat fee, by contract name

    $ archway contracts premium my-contract --premium-fee "1aconst"

  Set the premium flat fee, by address

    $ archway contracts premium archway1dstndnaelj95ksruudc2ww4s9epn8m59xft7jz --premium-fee "1aconst"

  Set the premium flat fee, from a specific account

    $ archway contracts premium my-contract --premium-fee "1aconst" --from "alice"
```

_See code: [src/commands/contracts/premium.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/contracts/premium.ts)_

## `archway contracts query balance [CONTRACT]`

Access the bank module to query the balance of smart contracts

```
Usage:
  $ archway contracts query balance [CONTRACT] [--json] [--log-level debug|error|info|warn] [--all]

Arguments:
  CONTRACT  Name of the contract

Flags:
  --all  Shows the balance of all contracts

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Query the balance of a contract

    $ archway contracts query balance my-contract

  Query the balance of all contracts in the project

    $ archway contracts query balance --all
```

_See code: [src/commands/contracts/query/balance.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/contracts/query/balance.ts)_

## `archway contracts query smart CONTRACT`

Queries a single smart contract

```
Usage:
  $ archway contracts query smart CONTRACT [STDININPUT] [--json] [--log-level debug|error|info|warn] [--no-validation]
    [--args <value> | --args-file <value> | ]

Arguments:
  CONTRACT  (required) Name of the contract

Flags:
  --args=<value>       JSON string with the message to send the smart contract
  --args-file=<value>  Path to a JSON file with a message to send to the smart contract
  --no-validation      Skip schema validation of the arguments

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Query a smart contract by contract name in the project, with query message in the --args flag

    $ archway contracts query smart my-contract --args '{"example":{}}'

  Query a smart contract by address, with query message in the --args flag

    $ archway contracts query smart archway13lq4qvmydry3p394jrrfuv2z5xemzdnsplqdrm --args '{"example":{}}'

  Query a smart contract, with query message from file

    $ archway contracts query smart my-contract --args-file "./queryMsg.json"

  Query a smart contract, with query message from stdin

    $ echo '{"example":{}}' | archway contracts query smart my-contract
```

_See code: [src/commands/contracts/query/smart.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/contracts/query/smart.ts)_

## `archway contracts store CONTRACT`

Stores a Wasm file on-chain

```
Usage:
  $ archway contracts store CONTRACT [--json] [--log-level debug|error|info|warn] [--instantiate-permission
    any-of|everybody|nobody] [--allowed-addresses <value>] [--keyring-backend file|os|test] [--keyring-path <value>] [-f
    <value>] [--fee <value>] [--no-confirm] [--gas-adjustment <value>]

Arguments:
  CONTRACT  (required) Name of the contract

Flags:
  --allowed-addresses=<value>        List of addresses that can instantiate a contract from the code; works only if the
                                     instantiate permission is set to "any-of"
  --instantiate-permission=<option>  [default: everybody] Controls the instantiation permissions for the stored wasm
                                     file
                                     <options: any-of|everybody|nobody>
  --no-confirm                       Don't show confirmation prompt

Keyring Flags:
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: file|os|test>
  --keyring-path=<value>      File-based keyring path

Transaction Flags:
  -f, --from=<value>        Signer of the tx
  --fee=<value>             Extra fees to pay along with the transaction
  --gas-adjustment=<value>  [default: 1.3] Multiplier that is applied to the default estimated gas to avoid running out
                            of gas exceptions

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Store a contract on-chain

    $ archway contracts store my-contract

  Store a contract on-chain, without confirmation prompt

    $ archway contracts store my-project --no-confirm

  Store a contract on-chain, with list of addresses allowed to instantiate

    $ archway contracts store my-project --instantiate-permission "any-of" --allowed-addresses \
      "archway13lq4qvmydry3p394jrrfuv2z5xemzdnsplqdrm,archway1dstndnaelj95ksruudc2ww4s9epn8m59xft7jz"

  Store a contract on-chain, with nobody allowed to instantiate

    $ archway contracts store my-project --instantiate-permission "no-one"
```

_See code: [src/commands/contracts/store.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/contracts/store.ts)_

## `archway help [COMMANDS]`

Display help for archway.

```
Usage:
  $ archway help [COMMANDS] [--json] [--log-level debug|error|info|warn]

Arguments:
  COMMANDS  Command to show help for.

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Description:
  Display help for archway.

Examples:
  $ archway help
```

_See code: [src/commands/help.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/help.ts)_

## `archway new [PROJECT-NAME]`

Initializes a new project repository

```
Usage:
  $ archway new [PROJECT-NAME] [--json] [--log-level debug|error|info|warn] [--chain <value>]
    [--contract] [--contract-name <value>] [--template <value>]

Arguments:
  PROJECT-NAME  Name of the new repository

Flags:
  --chain=<value>          ID of the chain
  --contract               Boolean flag to choose if you want to also create a contract with the project. Defaults to
                           true
  --contract-name=<value>  Name of the contract
  --template=<value>       Template of the contract to be created with your project

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Create a new project

    $ archway new

  Create a new project, with project name

    $ archway new my-project

  Create a new project, with chain id

    $ archway new my-project --chain="constantine-3"

  Create a new project, with contract name

    $ archway new my-project --contract-name="my-contract"

  Create a new project, with cw-20 template

    $ archway new my-project --chain="constantine-3" --contract-name="my-contract" --template="cw-20/base"

  Create a new project, with increment template

    $ CARGO_GENERATE_VALUE_VERSION=full archway new my-project --chain="constantine-3" --contract-name="my-contract" \
      --template="increment"
```

_See code: [src/commands/new.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/new.ts)_

## `archway rewards query ACCOUNT`

Queries the outstanding rewards for a specific account or address

```
Usage:
  $ archway rewards query ACCOUNT [--json] [--log-level debug|error|info|warn] [--keyring-backend file|os|test]
    [--keyring-path <value>]

Arguments:
  ACCOUNT  (required) Name of the key/account OR a valid bech32 address

Keyring Flags:
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: file|os|test>
  --keyring-path=<value>      File-based keyring path

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Query the outstanding rewards for an account by name

    $ archway rewards query alice

  Query the outstanding rewards for an account by address

    $ archway rewards query archway13lq4qvmydry3p394jrrfuv2z5xemzdnsplqdrm
```

_See code: [src/commands/rewards/query.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/rewards/query.ts)_

## `archway rewards withdraw`

Withdraws rewards for a specific account

```
Usage:
  $ archway rewards withdraw [--json] [--log-level debug|error|info|warn] [--keyring-backend file|os|test]
    [--keyring-path <value>] [-f <value>] [--fee <value>] [--no-confirm] [--gas-adjustment <value>]

Flags:
  --no-confirm  Don't show confirmation prompt

Keyring Flags:
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: file|os|test>
  --keyring-path=<value>      File-based keyring path

Transaction Flags:
  -f, --from=<value>        Signer of the tx
  --fee=<value>             Extra fees to pay along with the transaction
  --gas-adjustment=<value>  [default: 1.3] Multiplier that is applied to the default estimated gas to avoid running out
                            of gas exceptions

GLOBAL Flags:
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|error|info|warn>

Examples:
  Withdraw the rewards for an account, by name

    $ archway rewards withdraw --from "alice"

  Query the outstanding rewards for an account, by address

    $ archway rewards withdraw --from "archway13lq4qvmydry3p394jrrfuv2z5xemzdnsplqdrm"
```

_See code: [src/commands/rewards/withdraw.ts](https://github.com/archway-network/archway-cli/blob/v2.0.0/src/commands/rewards/withdraw.ts)_
<!-- commandsstop -->
