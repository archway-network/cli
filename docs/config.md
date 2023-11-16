`archway config`
================

Manage the configuration of the Archway CLI

* [`archway config chains import [FILE]`](#archway-config-chains-import-file)
* [`archway config chains list`](#archway-config-chains-list)
* [`archway config chains use CHAIN`](#archway-config-chains-use-chain)
* [`archway config deployments`](#archway-config-deployments)
* [`archway config get KEY`](#archway-config-get-key)
* [`archway config init`](#archway-config-init)
* [`archway config set KEY VALUE`](#archway-config-set-key-value)
* [`archway config show`](#archway-config-show)

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

_See code: [src/commands/config/chains/import.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/config/chains/import.ts)_

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

_See code: [src/commands/config/chains/list.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/config/chains/list.ts)_

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

_See code: [src/commands/config/chains/use.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/config/chains/use.ts)_

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

_See code: [src/commands/config/deployments.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/config/deployments.ts)_

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

_See code: [src/commands/config/get.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/config/get.ts)_

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

_See code: [src/commands/config/init.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/config/init.ts)_

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

_See code: [src/commands/config/set.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/config/set.ts)_

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

_See code: [src/commands/config/show.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/config/show.ts)_
