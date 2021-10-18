# Archway Developer CLI

Make sure you've installed and configured a few dependencies. For full installation and setup instructions visit https://docs.archway.io/docs/create/getting-started/install

### Dependencies

- [Rustc](https://www.rust-lang.org/tools/install "Install Rust")
- [Cargo](https://doc.rust-lang.org/cargo/getting-started/installation.html "Install Cargo")
- [Cargo Generate](https://crates.io/crates/cargo-generate "Install Cargo Generate")
- [Archwayd](https://github.com/archway-network/archway/tree/main/cmd/archwayd "Install Archway Daemon")
- [Docker](https://docs.docker.com/get-docker "Install Docker")
- [Npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm "Install Node.js and NPM")
- [Archway Developer CLI](https://github.com/archway-network/archway-cli "Install develolper CLI")


### Installation:
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
build                            Build current project
configure [options]              Print or modify environment settings
deploy [options]                 Deploy to network, or test deployability
faucet                           Request Testnet funds from faucet
history                          Print deployments history
network                          Show network settings or migrate between networks
new                              Create a new project for Archway network
query [options] <module> [type]  Query for data on Archway network
run [options]                    Run a custom script of your own creation
test                             Run unit tests
tx [options]                     Execute a transaction on Archway network
help [command]                   display help for command
```
