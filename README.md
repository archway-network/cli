Modulor CLI
=================

Modulor CLI for Archway network

[![oclif](https://img.shields.io/badge/cli-mod-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@archway-cli/modulor.svg)](https://npmjs.org/package/@archway-cli/modulor)
[![Downloads/week](https://img.shields.io/npm/dw/@archway-cli/modulor.svg)](https://npmjs.org/package/@archway-cli/modulor)
[![License](https://img.shields.io/npm/l/@archway-cli/modulor.svg)](https://github.com/archway-network/archway-cli-v2/blob/main/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g archway-cli
$ mod COMMAND
running command...
$ mod (--version)
archway-cli/0.0.0 darwin-arm64 node-v16.18.1
$ mod --help [COMMAND]
USAGE
  $ mod COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`mod accounts`](#mod-accounts)
* [`mod accounts balances`](#mod-accounts-balances)
* [`mod accounts balances get ACCOUNT`](#mod-accounts-balances-get-account)
* [`mod accounts balances send AMOUNT`](#mod-accounts-balances-send-amount)
* [`mod accounts get ACCOUNT`](#mod-accounts-get-account)
* [`mod accounts list`](#mod-accounts-list)
* [`mod accounts new ACCOUNT`](#mod-accounts-new-account)
* [`mod accounts remove ACCOUNT`](#mod-accounts-remove-account)
* [`mod config`](#mod-config)
* [`mod config chains export CHAIN`](#mod-config-chains-export-chain)
* [`mod config chains import [FILE]`](#mod-config-chains-import-file)
* [`mod config chains use`](#mod-config-chains-use)
* [`mod config deployments`](#mod-config-deployments)
* [`mod config init`](#mod-config-init)
* [`mod config show`](#mod-config-show)
* [`mod contracts`](#mod-contracts)
* [`mod contracts build CONTRACT`](#mod-contracts-build-contract)
* [`mod contracts execute CONTRACT`](#mod-contracts-execute-contract)
* [`mod contracts instantiate CONTRACT`](#mod-contracts-instantiate-contract)
* [`mod contracts metadata CONTRACT`](#mod-contracts-metadata-contract)
* [`mod contracts migrate CONTRACT`](#mod-contracts-migrate-contract)
* [`mod contracts new CONTRACT`](#mod-contracts-new-contract)
* [`mod contracts premium CONTRACT`](#mod-contracts-premium-contract)
* [`mod contracts query`](#mod-contracts-query)
* [`mod contracts query balance [CONTRACT]`](#mod-contracts-query-balance-contract)
* [`mod contracts query smart CONTRACT`](#mod-contracts-query-smart-contract)
* [`mod contracts store CONTRACT`](#mod-contracts-store-contract)
* [`mod new PROJECT-NAME`](#mod-new-project-name)
* [`mod rewards`](#mod-rewards)
* [`mod rewards query ACCOUNT`](#mod-rewards-query-account)
* [`mod rewards withdraw`](#mod-rewards-withdraw)

## `mod accounts`

Manages a local keystore with wallets to sign transactions.

```
USAGE
  $ mod accounts
```

_See code: [dist/commands/accounts/index.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/accounts/index.ts)_

## `mod accounts balances`

Manage the balances of an account.

```
USAGE
  $ mod accounts balances
```

_See code: [dist/commands/accounts/balances/index.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/accounts/balances/index.ts)_

## `mod accounts balances get ACCOUNT`

Query the balance of an address or account

```
USAGE
  $ mod accounts balances get ACCOUNT [--json] [--log-level debug|info|warn|error] [--keyring-backend test|file|os]
    [--keyring-path <value>]

ARGUMENTS
  ACCOUNT  Name of the key/account OR a valid bech32 address

FLAGS
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: test|file|os>
  --keyring-path=<value>      File-based keyring path

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod accounts balances get
```

_See code: [dist/commands/accounts/balances/get.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/accounts/balances/get.ts)_

## `mod accounts balances send AMOUNT`

Send tokens from an address or account to another

```
USAGE
  $ mod accounts balances send AMOUNT --to <value> [--json] [--log-level debug|info|warn|error] [--keyring-backend
    test|file|os] [--keyring-path <value>] [-f <value>] [--fee <value>] [--fee-account <value>] [--confirm]

ARGUMENTS
  AMOUNT  Token amount

FLAGS
  -f, --from=<value>          Signer of the tx
  --[no-]confirm              Asks for confirmation before broadcasting the tx or skips the prompt completely
  --fee=<value>               Extra fees to pay along with the transaction
  --fee-account=<value>       Account used to pays fees for the transaction instead of the signer
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: test|file|os>
  --keyring-path=<value>      File-based keyring path
  --to=<value>                (required) Destination of the funds

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod accounts balances send
```

_See code: [dist/commands/accounts/balances/send.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/accounts/balances/send.ts)_

## `mod accounts get ACCOUNT`

Displays details about an account

```
USAGE
  $ mod accounts get ACCOUNT [--json] [--log-level debug|info|warn|error] [--address] [--keyring-backend
    test|file|os] [--keyring-path <value>]

ARGUMENTS
  ACCOUNT  Name of the key/account OR a valid bech32 address

FLAGS
  --address                   Display the address only
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: test|file|os>
  --keyring-path=<value>      File-based keyring path

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod accounts get
```

_See code: [dist/commands/accounts/get.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/accounts/get.ts)_

## `mod accounts list`

Lists all accounts in the keyring

```
USAGE
  $ mod accounts list [--json] [--log-level debug|info|warn|error] [--keyring-backend test|file|os] [--keyring-path
    <value>]

FLAGS
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: test|file|os>
  --keyring-path=<value>      File-based keyring path

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod accounts list
```

_See code: [dist/commands/accounts/list.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/accounts/list.ts)_

## `mod accounts new ACCOUNT`

Adds a new wallet to the keystore

```
USAGE
  $ mod accounts new ACCOUNT [--json] [--log-level debug|info|warn|error] [--mnemonic <value>] [--ledger]
    [--keyring-backend test|file|os] [--keyring-path <value>]

ARGUMENTS
  ACCOUNT  Name of the key/account OR a valid bech32 address

FLAGS
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: test|file|os>
  --keyring-path=<value>      File-based keyring path
  --ledger
  --mnemonic=<value>          Wallet mnemonic (seed phrase)

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod accounts new
```

_See code: [dist/commands/accounts/new.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/accounts/new.ts)_

## `mod accounts remove ACCOUNT`

Removes an account from the keystore

```
USAGE
  $ mod accounts remove ACCOUNT [--json] [--log-level debug|info|warn|error] [-f] [--keyring-backend test|file|os]
    [--keyring-path <value>]

ARGUMENTS
  ACCOUNT  Name of the key/account OR a valid bech32 address

FLAGS
  -f, --force                 Forces execution (don't show confirmation prompt)
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: test|file|os>
  --keyring-path=<value>      File-based keyring path

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod accounts remove
```

_See code: [dist/commands/accounts/remove.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/accounts/remove.ts)_

## `mod config`

Display help for the config command.

```
USAGE
  $ mod config
```

_See code: [dist/commands/config/index.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/config/index.ts)_

## `mod config chains export CHAIN`

Exports a built-in chain registry file to [1m{project-root}/.modulor/chains/{chain-id}.json[22m.

```
USAGE
  $ mod config chains export CHAIN [--json] [--log-level debug|info|warn|error]

ARGUMENTS
  CHAIN  (constantine-3|titus-1) ID of the chain

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod config chains export
```

_See code: [dist/commands/config/chains/export.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/config/chains/export.ts)_

## `mod config chains import [FILE]`

Import a chain registry file and save it to [1m{project-root}/.modulor/chains/{chain-id}.json[22m.

```
USAGE
  $ mod config chains import [FILE] [STDININPUT] [--json] [--log-level debug|info|warn|error]

ARGUMENTS
  FILE  Path to file to be imported

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod config chains import
```

_See code: [dist/commands/config/chains/import.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/config/chains/import.ts)_

## `mod config chains use`

Switches the current chain in use and updates the [1mmodulor.json[22m config file with his information.

```
USAGE
  $ mod config chains use --chain <value> [--json] [--log-level debug|info|warn|error]

FLAGS
  --chain=<value>  (required) ID of the chain

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod config chains use
```

_See code: [dist/commands/config/chains/use.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/config/chains/use.ts)_

## `mod config deployments`

Displays the list of deployments, allows filtering by chain, action and contract.

```
USAGE
  $ mod config deployments [--json] [--log-level debug|info|warn|error] [--chain <value>] [--action
    store|instantiate|metadata|premium|migrate] [--contract <value>]

FLAGS
  --action=<option>   Deployment action to filter by
                      <options: store|instantiate|metadata|premium|migrate>
  --chain=<value>     ID of the chain
  --contract=<value>  Contract name to filter by

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod config deployments
```

_See code: [dist/commands/config/deployments.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/config/deployments.ts)_

## `mod config init`

Initializes a config file for the current project.

```
USAGE
  $ mod config init [--json] [--log-level debug|info|warn|error] [--chain <value>]

FLAGS
  --chain=<value>  ID of the chain

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod config init
```

_See code: [dist/commands/config/init.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/config/init.ts)_

## `mod config show`

Shows the config file for the current project.

```
USAGE
  $ mod config show [--json] [--log-level debug|info|warn|error]

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod config show
```

_See code: [dist/commands/config/show.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/config/show.ts)_

## `mod contracts`

Display help for the contracts command.

```
USAGE
  $ mod contracts
```

_See code: [dist/commands/contracts/index.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/contracts/index.ts)_

## `mod contracts build CONTRACT`

Builds the contract's WASM file (or an optimized version of it), and its schemas

```
USAGE
  $ mod contracts build CONTRACT [--json] [--log-level debug|info|warn|error] [--schemas] [--optimize]

ARGUMENTS
  CONTRACT  Name of the contract

FLAGS
  --optimize
  --schemas

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod contracts build
```

_See code: [dist/commands/contracts/build.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/contracts/build.ts)_

## `mod contracts execute CONTRACT`

Executes a transaction in a contract

```
USAGE
  $ mod contracts execute CONTRACT [STDININPUT] [--json] [--log-level debug|info|warn|error] [--amount <value>] [--args
    <value>] [--args-file <value>] [--keyring-backend test|file|os] [--keyring-path <value>] [-f <value>] [--fee
    <value>] [--fee-account <value>] [--confirm]

ARGUMENTS
  CONTRACT  Name of the contract

FLAGS
  -f, --from=<value>          Signer of the tx
  --amount=<value>            Funds to send to the contract on the transaction
  --args=<value>              JSON string with a valid execute schema for the contract
  --args-file=<value>         Path to a JSON file with a valid execute schema for the contract
  --[no-]confirm              Asks for confirmation before broadcasting the tx or skips the prompt completely
  --fee=<value>               Extra fees to pay along with the transaction
  --fee-account=<value>       Account used to pays fees for the transaction instead of the signer
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: test|file|os>
  --keyring-path=<value>      File-based keyring path

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod contracts execute
```

_See code: [dist/commands/contracts/execute.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/contracts/execute.ts)_

## `mod contracts instantiate CONTRACT`

Instantiates code stored on-chain with the given arguments

```
USAGE
  $ mod contracts instantiate CONTRACT [STDININPUT] --args <value> [--json] [--log-level debug|info|warn|error] [--admin
    <value>] [--no-admin] [--label <value>] [--code <value>] [--amount <value>] [--args-file <value>] [--keyring-backend
    test|file|os] [--keyring-path <value>] [-f <value>] [--fee <value>] [--fee-account <value>] [--confirm]

ARGUMENTS
  CONTRACT  Name of the contract

FLAGS
  -f, --from=<value>          Signer of the tx
  --admin=<value>             Name of an account OR a valid bech32 address used as the contract admin
  --amount=<value>            Funds to send to the contract during instantiation
  --args=<value>              (required) JSON string with a valid instantiate schema for the contract
  --args-file=<value>         Path to a JSON file with a valid instantiate schema for the contract
  --code=<value>              Code stored
  --[no-]confirm              Asks for confirmation before broadcasting the tx or skips the prompt completely
  --fee=<value>               Extra fees to pay along with the transaction
  --fee-account=<value>       Account used to pays fees for the transaction instead of the signer
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: test|file|os>
  --keyring-path=<value>      File-based keyring path
  --label=<value>             A human-readable name for this contract, displayed on explorers
  --no-admin                  Instantiates the contract without an admin

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod contracts instantiate
```

_See code: [dist/commands/contracts/instantiate.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/contracts/instantiate.ts)_

## `mod contracts metadata CONTRACT`

Sets a contract rewards metadata

```
USAGE
  $ mod contracts metadata CONTRACT [--json] [--log-level debug|info|warn|error] [--owner-address <value>]
    [--rewards-address <value>] [--keyring-backend test|file|os] [--keyring-path <value>] [-f <value>] [--fee <value>]
    [--fee-account <value>] [--confirm]

ARGUMENTS
  CONTRACT  Name of the contract

FLAGS
  -f, --from=<value>          Signer of the tx
  --[no-]confirm              Asks for confirmation before broadcasting the tx or skips the prompt completely
  --fee=<value>               Extra fees to pay along with the transaction
  --fee-account=<value>       Account used to pays fees for the transaction instead of the signer
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: test|file|os>
  --keyring-path=<value>      File-based keyring path
  --owner-address=<value>     Owner of the contract metadata
  --rewards-address=<value>   Rewards destination address

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod contracts metadata
```

_See code: [dist/commands/contracts/metadata.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/contracts/metadata.ts)_

## `mod contracts migrate CONTRACT`

Runs a contract migration

```
USAGE
  $ mod contracts migrate CONTRACT [STDININPUT] --code <value> [--json] [--log-level debug|info|warn|error]
    [--keyring-backend test|file|os] [--keyring-path <value>] [-f <value>] [--fee <value>] [--fee-account <value>]
    [--confirm] [--args <value>] [--args-file <value>]

ARGUMENTS
  CONTRACT  Name of the contract

FLAGS
  -f, --from=<value>          Signer of the tx
  --args=<value>              JSON string with a message to be passed to the contract on migration
  --args-file=<value>         Path to a JSON file with a message to be passed to the contract on migration
  --code=<value>              (required) New code stored
  --[no-]confirm              Asks for confirmation before broadcasting the tx or skips the prompt completely
  --fee=<value>               Extra fees to pay along with the transaction
  --fee-account=<value>       Account used to pays fees for the transaction instead of the signer
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: test|file|os>
  --keyring-path=<value>      File-based keyring path

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod contracts migrate
```

_See code: [dist/commands/contracts/migrate.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/contracts/migrate.ts)_

## `mod contracts new CONTRACT`

Scaffolds a new Smart Contract from a template

```
USAGE
  $ mod contracts new CONTRACT [--json] [--log-level debug|info|warn|error] [--template <value>]

ARGUMENTS
  CONTRACT  Name of the contract

FLAGS
  --template=<value>  Template name

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod contracts new
```

_See code: [dist/commands/contracts/new.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/contracts/new.ts)_

## `mod contracts premium CONTRACT`

Sets a contract premium flat fee for a contract

```
USAGE
  $ mod contracts premium CONTRACT --premium-fee <value> [--json] [--log-level debug|info|warn|error]
    [--keyring-backend test|file|os] [--keyring-path <value>] [-f <value>] [--fee <value>] [--fee-account <value>]
    [--confirm]

ARGUMENTS
  CONTRACT  Name of the contract

FLAGS
  -f, --from=<value>          Signer of the tx
  --[no-]confirm              Asks for confirmation before broadcasting the tx or skips the prompt completely
  --fee=<value>               Extra fees to pay along with the transaction
  --fee-account=<value>       Account used to pays fees for the transaction instead of the signer
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: test|file|os>
  --keyring-path=<value>      File-based keyring path
  --premium-fee=<value>       (required) Token amount

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod contracts premium
```

_See code: [dist/commands/contracts/premium.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/contracts/premium.ts)_

## `mod contracts query`

Display help for the contracts query command.

```
USAGE
  $ mod contracts query
```

_See code: [dist/commands/contracts/query/index.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/contracts/query/index.ts)_

## `mod contracts query balance [CONTRACT]`

Access the bank module to query the balance of contracts

```
USAGE
  $ mod contracts query balance [CONTRACT] [--json] [--log-level debug|info|warn|error] [--all]

ARGUMENTS
  CONTRACT  Name of the contract

FLAGS
  --all  Shows the balance of all contracts

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod contracts query balance
```

_See code: [dist/commands/contracts/query/balance.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/contracts/query/balance.ts)_

## `mod contracts query smart CONTRACT`

Queries a single smart contract

```
USAGE
  $ mod contracts query smart CONTRACT [STDININPUT] [--json] [--log-level debug|info|warn|error] [--keyring-backend
    test|file|os] [--keyring-path <value>] [-f <value>] [--fee <value>] [--fee-account <value>] [--confirm] [--args
    <value>] [--args-file <value>]

ARGUMENTS
  CONTRACT  Name of the contract

FLAGS
  -f, --from=<value>          Signer of the tx
  --args=<value>              JSON string with a message to be passed to the contract on migration
  --args-file=<value>         Path to a JSON file with a message to be passed to the contract on migration
  --[no-]confirm              Asks for confirmation before broadcasting the tx or skips the prompt completely
  --fee=<value>               Extra fees to pay along with the transaction
  --fee-account=<value>       Account used to pays fees for the transaction instead of the signer
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: test|file|os>
  --keyring-path=<value>      File-based keyring path

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod contracts query smart
```

_See code: [dist/commands/contracts/query/smart.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/contracts/query/smart.ts)_

## `mod contracts store CONTRACT`

Stores a WASM file on-chain

```
USAGE
  $ mod contracts store CONTRACT [--json] [--log-level debug|info|warn|error] [--instantiate-permission
    any-of|everybody|nobody] [--allowed-addresses <value>] [--keyring-backend test|file|os] [--keyring-path <value>] [-f
    <value>] [--fee <value>] [--fee-account <value>] [--confirm]

ARGUMENTS
  CONTRACT  Name of the contract

FLAGS
  -f, --from=<value>                 Signer of the tx
  --allowed-addresses=<value>        List of addresses that can instantiate a contract from the code; works only if the
                                     instantiate permission is set to "any-of"
  --[no-]confirm                     Asks for confirmation before broadcasting the tx or skips the prompt completely
  --fee=<value>                      Extra fees to pay along with the transaction
  --fee-account=<value>              Account used to pays fees for the transaction instead of the signer
  --instantiate-permission=<option>  [default: everybody] Controls the instantiation permissions for the stored wasm
                                     file
                                     <options: any-of|everybody|nobody>
  --keyring-backend=<option>         [default: os] Backend for the keyring
                                     <options: test|file|os>
  --keyring-path=<value>             File-based keyring path

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod contracts store
```

_See code: [dist/commands/contracts/store.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/contracts/store.ts)_

## `mod new PROJECT-NAME`

Initializes a new project repository

```
USAGE
  $ mod new PROJECT-NAME [--json] [--log-level debug|info|warn|error] [--chain <value>] [--no-contract]
    [--contract-name <value>] [--template <value>]

FLAGS
  --chain=<value>          ID of the chain
  --contract-name=<value>
  --no-contract
  --template=<value>

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod new
```

_See code: [dist/commands/new.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/new.ts)_

## `mod rewards`

Display help for the rewards command.

```
USAGE
  $ mod rewards
```

_See code: [dist/commands/rewards/index.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/rewards/index.ts)_

## `mod rewards query ACCOUNT`

Queries the outstanding rewards for a specific account or address

```
USAGE
  $ mod rewards query ACCOUNT [--json] [--log-level debug|info|warn|error] [--keyring-backend test|file|os]
    [--keyring-path <value>]

ARGUMENTS
  ACCOUNT  Name of the key/account OR a valid bech32 address

FLAGS
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: test|file|os>
  --keyring-path=<value>      File-based keyring path

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod rewards query
```

_See code: [dist/commands/rewards/query.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/rewards/query.ts)_

## `mod rewards withdraw`

Withdraws rewards for a specific account

```
USAGE
  $ mod rewards withdraw [--json] [--log-level debug|info|warn|error] [--keyring-backend test|file|os] [--keyring-path
    <value>] [-f <value>] [--fee <value>] [--fee-account <value>] [--confirm]

FLAGS
  -f, --from=<value>          Signer of the tx
  --[no-]confirm              Asks for confirmation before broadcasting the tx or skips the prompt completely
  --fee=<value>               Extra fees to pay along with the transaction
  --fee-account=<value>       Account used to pays fees for the transaction instead of the signer
  --keyring-backend=<option>  [default: os] Backend for the keyring
                              <options: test|file|os>
  --keyring-path=<value>      File-based keyring path

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod rewards withdraw
```

_See code: [dist/commands/rewards/withdraw.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/rewards/withdraw.ts)_
<!-- commandsstop -->
