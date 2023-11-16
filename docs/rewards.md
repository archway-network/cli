`archway rewards`
=================

Queries and transactions in the Archway network's Rewards module

* [`archway rewards query ACCOUNT`](#archway-rewards-query-account)
* [`archway rewards withdraw`](#archway-rewards-withdraw)

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

_See code: [src/commands/rewards/query.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/rewards/query.ts)_

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
  --gas-adjustment=<value>  [default: 1.5] Multiplier that is applied to the default estimated gas to avoid running out
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

_See code: [src/commands/rewards/withdraw.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/rewards/withdraw.ts)_
