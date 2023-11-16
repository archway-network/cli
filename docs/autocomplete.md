`archway autocomplete`
======================

display autocomplete installation instructions

* [`archway autocomplete [SHELL]`](#archway-autocomplete-shell)

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
