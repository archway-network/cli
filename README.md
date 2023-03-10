oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![Downloads/week](https://img.shields.io/npm/dw/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![License](https://img.shields.io/npm/l/oclif-hello-world.svg)](https://github.com/oclif/hello-world/blob/main/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g archway-cli
$ archway COMMAND
running command...
$ archway (--version)
archway-cli/0.0.0 darwin-arm64 node-v16.18.1
$ archway --help [COMMAND]
USAGE
  $ archway COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`archway hello PERSON`](#archway-hello-person)
* [`archway hello world`](#archway-hello-world)
* [`archway help [COMMANDS]`](#archway-help-commands)
* [`archway plugins`](#archway-plugins)
* [`archway plugins:install PLUGIN...`](#archway-pluginsinstall-plugin)
* [`archway plugins:inspect PLUGIN...`](#archway-pluginsinspect-plugin)
* [`archway plugins:install PLUGIN...`](#archway-pluginsinstall-plugin-1)
* [`archway plugins:link PLUGIN`](#archway-pluginslink-plugin)
* [`archway plugins:uninstall PLUGIN...`](#archway-pluginsuninstall-plugin)
* [`archway plugins:uninstall PLUGIN...`](#archway-pluginsuninstall-plugin-1)
* [`archway plugins:uninstall PLUGIN...`](#archway-pluginsuninstall-plugin-2)
* [`archway plugins update`](#archway-plugins-update)

## `archway hello PERSON`

Say hello

```
USAGE
  $ archway hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ oex hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [dist/commands/hello/index.ts](https://github.com/archway-network/archway-cli-v2/blob/v0.0.0/dist/commands/hello/index.ts)_

## `archway hello world`

Say hello world

```
USAGE
  $ archway hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ archway hello world
  hello world! (./src/commands/hello/world.ts)
```

## `archway help [COMMANDS]`

Display help for archway.

```
USAGE
  $ archway help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for archway.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.6/src/commands/help.ts)_

## `archway plugins`

List installed plugins.

```
USAGE
  $ archway plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ archway plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.3.2/src/commands/plugins/index.ts)_

## `archway plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ archway plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ archway plugins add

EXAMPLES
  $ archway plugins:install myplugin 

  $ archway plugins:install https://github.com/someuser/someplugin

  $ archway plugins:install someuser/someplugin
```

## `archway plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ archway plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ archway plugins:inspect myplugin
```

## `archway plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ archway plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ archway plugins add

EXAMPLES
  $ archway plugins:install myplugin 

  $ archway plugins:install https://github.com/someuser/someplugin

  $ archway plugins:install someuser/someplugin
```

## `archway plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ archway plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ archway plugins:link myplugin
```

## `archway plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ archway plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ archway plugins unlink
  $ archway plugins remove
```

## `archway plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ archway plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ archway plugins unlink
  $ archway plugins remove
```

## `archway plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ archway plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ archway plugins unlink
  $ archway plugins remove
```

## `archway plugins update`

Update installed plugins.

```
USAGE
  $ archway plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```
<!-- commandsstop -->
