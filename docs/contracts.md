`archway contracts`
===================

Perform actions with the contracts on a project

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

_See code: [src/commands/contracts/build.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/contracts/build.ts)_

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
  --gas-adjustment=<value>  [default: 1.5] Multiplier that is applied to the default estimated gas to avoid running out
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

_See code: [src/commands/contracts/execute.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/contracts/execute.ts)_

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
  --gas-adjustment=<value>  [default: 1.5] Multiplier that is applied to the default estimated gas to avoid running out
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

_See code: [src/commands/contracts/instantiate.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/contracts/instantiate.ts)_

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
  --gas-adjustment=<value>  [default: 1.5] Multiplier that is applied to the default estimated gas to avoid running out
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

_See code: [src/commands/contracts/metadata.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/contracts/metadata.ts)_

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
  --gas-adjustment=<value>  [default: 1.5] Multiplier that is applied to the default estimated gas to avoid running out
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

_See code: [src/commands/contracts/migrate.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/contracts/migrate.ts)_

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

_See code: [src/commands/contracts/new.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/contracts/new.ts)_

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
  --gas-adjustment=<value>  [default: 1.5] Multiplier that is applied to the default estimated gas to avoid running out
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

_See code: [src/commands/contracts/premium.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/contracts/premium.ts)_

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

_See code: [src/commands/contracts/query/balance.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/contracts/query/balance.ts)_

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

_See code: [src/commands/contracts/query/smart.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/contracts/query/smart.ts)_

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
  --gas-adjustment=<value>  [default: 1.5] Multiplier that is applied to the default estimated gas to avoid running out
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

_See code: [src/commands/contracts/store.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/contracts/store.ts)_
