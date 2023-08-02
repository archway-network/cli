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
* [`mod config`](#mod-config)
* [`mod config chains`](#mod-config-chains)
* [`mod config chains export CHAIN`](#mod-config-chains-export-chain)
* [`mod config chains import [FILE]`](#mod-config-chains-import-file)
* [`mod config chains use`](#mod-config-chains-use)
* [`mod config deployments`](#mod-config-deployments)
* [`mod config init`](#mod-config-init)
* [`mod config show`](#mod-config-show)
* [`mod contracts`](#mod-contracts)
* [`mod rewards`](#mod-rewards)

## `mod accounts`

Display help for the accounts command.

```
USAGE
  $ mod accounts
```

_See code: [dist/commands/accounts/index.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/accounts/index.ts)_

## `mod config`

Display help for the config command.

```
USAGE
  $ mod config
```

_See code: [dist/commands/config/index.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/config/index.ts)_

## `mod config chains`

Chain management commands. The chain files follow the https://raw.githubusercontent.com/cosmos/chain-registry/master/chain.schema.json schema.

```
USAGE
  $ mod config chains
```

## `mod config chains export CHAIN`

Exports a built-in chain registry file to {project-root}/.modulor/chains/{chain-id}.json.

```
USAGE
  $ mod config chains export CHAIN [--json] [--log-level debug|info|warn|error]

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod config chains export
```

## `mod config chains import [FILE]`

Import a chain registry file and save it to {project-root}/.modulor/chains/{chain-id}.json.

```
USAGE
  $ mod config chains import [FILE] [PIPED] [--json] [--log-level debug|info|warn|error]

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod config chains import
```

## `mod config chains use`

Switches the current chain in use and updates the modulor.json config file with his information.

```
USAGE
  $ mod config chains use --chain <value> [--json] [--log-level debug|info|warn|error]

FLAGS
  --chain=<value>  (required)

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod config chains use
```

## `mod config deployments`

Displays the list of deployments, allows filtering by chain, action and contract.

```
USAGE
  $ mod config deployments [--json] [--log-level debug|info|warn|error] [--chain <value>] [--action
    store|instantiate|metadata|premium] [--contract <value>]

FLAGS
  --action=<option>   <options: store|instantiate|metadata|premium>
  --chain=<value>
  --contract=<value>

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod config deployments
```

## `mod config init`

Initializes a config file for the current project.

```
USAGE
  $ mod config init [--json] [--log-level debug|info|warn|error] [--chain <value>]

FLAGS
  --chain=<value>

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ mod config init
```

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

## `mod contracts`

Display help for the contracts command.

```
USAGE
  $ mod contracts
```

_See code: [dist/commands/contracts/index.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/contracts/index.ts)_

## `mod rewards`

Display help for the rewards command.

```
USAGE
  $ mod rewards
```

_See code: [dist/commands/rewards/index.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/rewards/index.ts)_
<!-- commandsstop -->
