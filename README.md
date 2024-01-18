# Archway Developer CLI

[![Archway CLI](https://img.shields.io/badge/cli-archway-brightgreen.svg)](https://docs.archway.io)
[![Version](https://img.shields.io/npm/v/@archwayhq/cli)](https://www.npmjs.com/package/@archwayhq/cli)
[![Downloads/Week](https://img.shields.io/npm/dw/@archwayhq/cli.svg)](https://npmjs.org/package/@archwayhq/cli)
![Tests](https://github.com/archway-network/cli/actions/workflows/test.yml/badge.svg)
![CodeQL](https://github.com/archway-network/cli/actions/workflows/codeql.yml/badge.svg)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/070b358e0ece44c2b45867d945c46a28)](https://app.codacy.com/gh/archway-network/cli/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![License](https://img.shields.io/github/license/archway-network/cli?label=License&logo=opensourceinitiative&logoColor=white&color=informational)](https://opensource.org/licenses/Apache-2.0)

Develop WASM smart contracts with the Archway Network's Developer CLI.

- [Archway Developer CLI](#archway-developer-cli)
  - [Dependencies](#dependencies)
  - [CLI Installation](#cli-installation)
    - [Install the latest published version](#install-the-latest-published-version)
    - [Install the pre-release version](#install-the-pre-release-version)
    - [Install the development version](#install-the-development-version)
  - [Commands](#commands)

## Dependencies

Make sure you've installed and configured all dependencies. For the full
installation and setup instructions, [visit the docs](https://docs.archway.io/developers/getting-started/install).

- [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm "Install Node.js and NPM")
- [cargo](https://doc.rust-lang.org/cargo/getting-started/installation.html "Install Cargo")
- [cargo-generate](https://crates.io/crates/cargo-generate "Install Cargo Generate")
- [docker](https://docs.docker.com/get-docker "Install Docker")

If you are on a Linux machine with a distribution different from Ubuntu, you may
need to install the [GNOME Keyring](https://wiki.archlinux.org/title/GNOME/Keyring),
or any other keyring compatible with the [Secret service API](https://www.gnu.org/software/emacs/manual/html_node/auth/Secret-Service-API.html).

## CLI Installation

### Install the latest published version

```bash
npm i -g @archwayhq/cli
```

### Install the development version

```bash
npm i -g 'github:archway-network/cli'
```

## Commands

<!-- commands -->


- [`archway accounts`](docs/accounts.md) - Manages a local keyring with wallets to sign transactions
- [`archway autocomplete`](docs/autocomplete.md) - display autocomplete installation instructions
- [`archway config`](docs/config.md) - Manage the configuration of the Archway CLI
- [`archway contracts`](docs/contracts.md) - Perform actions with the contracts on a project
- [`archway help`](docs/help.md) - Display help for archway.
- [`archway new`](docs/new.md) - Initializes a new project repository
- [`archway rewards`](docs/rewards.md) - Queries and transactions in the Archway network's Rewards module

<!-- commandsstop -->
