`archway help`
==============

Display help for archway.

* [`archway help [COMMANDS]`](#archway-help-commands)

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

_See code: [src/commands/help.ts](https://github.com/archway-network/cli/blob/v2.1.0-rc.1/src/commands/help.ts)_
