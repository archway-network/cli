# Archway Developer CLI

Make sure you've installed and configured all dependencies. For full installation and setup instructions, [visit the docs](https://docs.archway.io/developers/getting-started/install).

## Dependencies

- [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm "Install Node.js and NPM")
- [archwayd](https://github.com/archway-network/archway/tree/main/cmd/archwayd "Install Archway Daemon")
- [cargo](https://doc.rust-lang.org/cargo/getting-started/installation.html "Install Cargo")
- [cargo-generate](https://crates.io/crates/cargo-generate "Install Cargo Generate")
- [docker](https://docs.docker.com/get-docker "Install Docker")

## CLI Installation

### Install the latest published version

```bash
npm i -g @archwayhq/cli
```

or

```bash
yarn global add @archwayhq/cli
```

### Install the development version

```bash
npm i -g 'github:archway-network/archway-cli'
```

or

```bash
yarn global add 'github:archway-network/archway-cli'
```

## Usage

```
archway [command] [options]
```

### Commands

```
accounts [options]               List available wallets or add new wallet
build [options]                  Build the project
config [options]                 Print or create a config file
instantiate [options]            Instantiate a stored contract
deploy [options]                 Deploy to network, or test deployability
history [options]                Print deployments history for the currently selected network
metadata [options]               Sets the contract metadata with rewards parameters
network [options]                Show network settings or migrate between networks
new [options] [name]             Create a new project for Archway network
query [options] <module> [type]  Query for data on Archway network
store [options]                  Stores and verify a contract on-chain
tx [options]                     Execute a smart contract transaction on Archway network
help [command]                   display help for command
```
