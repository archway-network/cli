`archway accounts`
==================

Manages a local keyring with wallets to sign transactions

* [`archway accounts balances get ACCOUNT`](#archway-accounts-balances-get-account)
* [`archway accounts balances send AMOUNT`](#archway-accounts-balances-send-amount)
* [`archway accounts export ACCOUNT`](#archway-accounts-export-account)
* [`archway accounts get ACCOUNT`](#archway-accounts-get-account)
* [`archway accounts list`](#archway-accounts-list)
* [`archway accounts new [ACCOUNT-NAME]`](#archway-accounts-new-account-name)
* [`archway accounts remove ACCOUNT`](#archway-accounts-remove-account)

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

_See code: [src/commands/accounts/balances/get.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/accounts/balances/get.ts)_

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
  --gas-adjustment=<value>  [default: 1.5] Multiplier that is applied to the default estimated gas to avoid running out
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

_See code: [src/commands/accounts/balances/send.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/accounts/balances/send.ts)_

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

_See code: [src/commands/accounts/export.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/accounts/export.ts)_

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

_See code: [src/commands/accounts/get.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/accounts/get.ts)_

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

_See code: [src/commands/accounts/list.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/accounts/list.ts)_

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

_See code: [src/commands/accounts/new.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/accounts/new.ts)_

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

_See code: [src/commands/accounts/remove.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/accounts/remove.ts)_
