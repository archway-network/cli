`archway new`
=============

Initializes a new project repository

* [`archway new [PROJECT-NAME]`](#archway-new-project-name)

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

_See code: [src/commands/new.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/new.ts)_
