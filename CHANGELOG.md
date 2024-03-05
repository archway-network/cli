# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## 2.1.0 (2024-03-04)

### ⚠ BREAKING CHANGES

- the CLI will now only support the Archway protocol version `>=6.0.0` (#288)
- bumped the minimum supported Node.js version to v18 as v16 LTS ended (#294)

### Added

- **contracts:** added a flag in the `metadata` sub-command to withdraw rewards
  directly to the wallet (#316)

### Fixed

- **core:** fixed the version check hook storing the current version
  on cache (#286)
- **core:** fixed installation on WSL that failed due to invalid build scripts
  in the keyring-go package (#294)
- **core:** bumped keyring-go package to fix edge case when installing the CLI
  in WSL2 (#311)

### Changed

- **config:** updated the chain file for `constantine-3` (#309)

## 2.0.2 (2023-12-02)

### Fixed

- **config:** fixed an issue that impeded the user to differentiate chains by
  the name (mainnet and testnet).

## 2.0.1 (2023-11-06)

### Fixed

- **instantiate:** fixed a circular dependency error and removed an unnecessary
  cargo workspace check.

## 2.0.0 (2023-10-27)

### ⚠ BREAKING CHANGES

- **config:** the following sub-commands under config were removed: `chain-id`,
  `contracts-path`, `default-account`, `keyring-backend`, `keyring-path`

### Added

- **accounts:** command to export the private key (#266)
- **config:** commands to get/set generic config values (#271)
- **plugins:** added plugin for bash/zsh completion (#272)

### Fixed

- **accounts:** allow querying balances for any valid address (#248)
- **accounts:** don't break when deleting an account with invalid format (#256)
- **contracts:** added missing types for CosmWasm schema validation (#252)
- **core:** gracefully stop running processes on Ctrl+C (#260)
- **core:** fixed the rust optimizer build cache volume (#260)

### Changed

- **plugins:** improved the help command output (#253)
- **contracts:** standardized the sub-commands flags (#261 and #262)
- **config:** validate chain using JSON schema (#271)

## 2.0.0-beta.1 (2023-09-20)

### ⚠ BREAKING CHANGES

- **core:** renamed the flag `--force` to `--no-confirm` in the sub-commands:
  - `accounts`: `remove`
  - `contracts`: `premium` and `store`

### Added

- **contracts:** flag to skip validation on contracts sub-commands (#233)
- **config:** new command to list available chains (#240)
- **core:** added usage example in several commands (#227)

### Fixed

- **contracts:** running the `build` command without a contract name will now
  build the entire workspace (#237)
- **contracts:** building a contract with the `--json` flag will suppress all
  output (#237)
- **core:** renamed the flag `--force` to `--no-confirm` in several commands (#226)
- **core:** fixed processing order for stdin pipes (#227)

## 2.0.0-alpha.2 (2023-09-15)

### ⚠ BREAKING CHANGES

- **config:** Changed the config file path. To migrate from `v2.0.0-alpha.1` to
  `v2.0.0-alpha.2`, users will have to rename the config folder from
  `./.archway-cli` to `./.archway` and move the config file from
  `archway-cli.json` to `.archway/config.json`.
- **accounts:** any accounts created using version `2.0.0-alpha.1` must
  be recovered from the mnemonic using the command `archway accounts new
--recover {name}`.

### Added

- **config:** management of global config files in `~/.config/archway` (#221)
- **accounts:** store the private key on the keyring (#218)

### Fixed

- **contracts**: validate the schema of Rust's numeric types (#214)
- **contracts:** load templates for new projects from the `main` branch (#217)
- **config:** remove the `-cli` suffix from the config path (#215)
- **core:** add other aliases for version flag (#229)
- **core:** update all description texts (#232)

### Code Refactoring

- **accounts:** update the keyring storage workflow (#235)

## 2.0.0-alpha.1 (2023-08-29)

### ⚠ BREAKING CHANGES

- This version of the CLI is a complete rewrite of whole codebase and is not
  compatible with previous versions. To migrate from `v1.*` to `v2.*`, users
  will have to import their keys using the available commands in
  `archway accounts`, and generate a new config file at the root of the project
  using `config init`.

### Added

- **contracts:** commands for all stages of contract development and deployment
  (c931552, 47c0b29, 39e81c3, c432704, 54b4486, bb1fda2, 6ac75b3, 364154f, 4efcd0f,
  3a19192)
- **rewards:** new command to query and withdraw rewards (0e6c993 and 82b0ae3)
- **config:** added new sub-commands to manage your project config (6bb3000, 59245c3)
- **config:** support for importing and exporting chain specs (3b1ed5a)
- **cli:** added the help command (#207)

### Changed

- **new:** defaults to a workspace project template and changed flags (3aaa062)
- **accounts:** manages encrypted keys and transfers (82d4ae7, 5346235, 1d116d1,
  7879cbe)

## 1.6.2 (2023-08-25)

### Fixed

- **archwayd:** fix semantic version check for new releases (#205)

### Security

- **deps:** bump word-wrap from 1.2.3 to 1.2.4 (#204)

## 1.6.1 (2023-07-05)

### Fixed

- **archwayd:** cleanup gas simulation to execute tx (#203)

## 1.6.0 (2023-07-03)

### ⚠ BREAKING CHANGES

- **archwayd:** Dropped support for the Docker version of `archwayd`. To migrate
  from Docker-based environments, users will have to install `archwayd` from the
  official binary releases in the protocol repository, and also export/import
  their keys using the available commands in `archwayd keys`.

### Added

- **networks:** add mainnet (#202)
- **networks:** add constantine-3 (#177)
- **premium:** add command to set flat fee (#200)

### Changed

- **store:** saves the deployed wasm checksum in config (#183)
- **instantiate:** save the deployed label (#182)
- **archwayd:** deprecated archwayd on Docker (#190)

### Fixed

- **archwayd:** don't freeze the shell (#184)
- **archwayd:** validate the minimum client version (#180)
- **archwayd:** validate errors printed to stderr (#194)
- **build:** throw exception instead of hardcoded text (#176)
- **cli:** check for newer versions using semver (#185)
- **networks:** renamed local network to localnet (#188)
- **cargo:** resolve the WASM file name on arm64 (#196)
- **tx:** execute contracts with premium enabled (#201)

## 1.5.1 (2023-04-03)

### Changed

- **networks:** update chain id and RPC endpoint for constantine-2 (#171)

## 1.5.0 (2023-03-15)

### Added

- **query:** added flag to print raw json to stdout (#164)

### Changed

- **accounts:** the command output will default to text mode for better
  readability (#167)
- **build:** bump rust-optimizer to 0.12.12 (#162)

### Fixed

- **cli:** fixed an output error when running commands that require waiting for
  a tx result (#163)
- **cli:** fixed issue when fetching the last contract address deployed (#165)
- **instantiate:** fixed error when the codeId is not found in the deployments
  state (#166)

## 1.4.1 (2023-02-28)

### Fixed

- **build:** fixed error when running the CosmWasm Optimizer image on
  M1 Macbooks (#161)

## 1.4.0 (2023-02-21)

### ⚠ BREAKING CHANGES

- **networks:** removed `torii` from the networks list (#153)

### Changed

- **networks:** change the default gas adjustment parameter to `1.5` instead of
  `1.2` (#153)
- **build:** updated the CosmWasm Optimizer image to `0.12.11` (#155)
- **build:** enable rust backtrace in optimizer (#156)
- **archwayd:** use the `archwaynetwork/archwayd:v0.2.0` tag by default (#159)
- **archwayd:** connect the container to the host network to allow interaction
  with a node running on the host machine (#159)

### Fixed

- **build:** fixed error when the CosmWasm Optimizer image didn't exist in the
  local environment (#155)
- **build:** fixed error when a build container is already running in the
  background (#157)
- **store:** fixed error when validating the stored wasm file on-chain (#158)

## 1.3.0 (2023-01-20)

### ⚠ BREAKING CHANGES

- **cli:** deprecate support for nodejs 14 (#130)
- **cli:** deprecate the `run` command (#125)
- **cli:** deprecate the `test` command (#132)
- **cli:** renamed the `configure` command to `config` (#131)
- **build:** Docker is now a hard requirement (#128)

### Added

- **archwayd:** use the minimum gas fee in all transactions (#120)
- **history:** list deployments for current chain (#126)
- **cargo:** parse metadata for workspaces (#127)
- **config:** initialize config files in existing projects (#131)
- **network:** enable local network (726c452)

### Changed

- **archwayd:** set metadata using the new rewards module (#121)
- **config:** store project name in deployment history (#137)
- **build:** use the rust-optimizer Docker image instead of wasm-opt (#128)

### Fixed

- **cargo:** check current path to fetch metadata (#124)
- **cli:** fail fast when transactions do not succeed (#122)
- **metadata:** typo in --rewards-address flag (#123)

### Security

- **deps:** bump json5 from 2.2.1 to 2.2.3 (#133)
