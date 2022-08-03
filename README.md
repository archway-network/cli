# Archway Developer CLI

Make sure you've installed and configured a few dependencies. For full installation and setup instructions visit https://docs.archway.io/docs/create/getting-started/install

### Dependencies

- [Npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm "Install Node.js and NPM")
- [Archwayd](https://github.com/archway-network/archway/tree/main/cmd/archwayd "Install Archway Daemon")
- [Rustc](https://www.rust-lang.org/tools/install "Install Rust")
- [Cargo](https://doc.rust-lang.org/cargo/getting-started/installation.html "Install Cargo")
- [Cargo Generate](https://crates.io/crates/cargo-generate "Install Cargo Generate")
- [Binaryen](https://github.com/WebAssembly/binaryen "Install Binaryen toolchain")
- [Docker](https://docs.docker.com/get-docker "Install Docker") [optional]

### CLI Installation:

#### Install using `npm`:

```
npm install -g @archwayhq/cli
```

#### Install from source:

```
git clone git@github.com:archway-network/archway-cli.git
cd archway-cli
npm install -g
```

### Usage:

```
archway [command] [options]
```

### Options:

```
-v, --version       output the current version
-h, --help          display help for command
```

### Commands:
```
accounts [options]               List available wallets or add new wallet
build [options]                  Build the project
configure [options]              Print or modify environment settings
instantiate [options]            Instantiate a stored contract
deploy [options]                 Deploy to network, or test deployability
history                          Print deployments history
metadata [options]               Set the contract metadata
network [options]                Show network settings or migrate between networks
new [options] [name]             Create a new project for Archway network
query [options] <module> [type]  Query for data on Archway network
run [options]                    Run a custom script of your own creation
store [options]                  Stores and verify a contract on-chain
test                             Run unit tests
tx [options]                     Execute a smart contract transaction on Archway network
help [command]                   display help for command
```
