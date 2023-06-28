const _ = require('lodash');
const debug = require('debug')('archwayd');
const semver = require('semver');
const { spawn } = require('promisify-child-process');

const { KeysCommands } = require('./keys');
const { QueryCommands } = require('./query');
const { TxCommands, TxExecutionError } = require('./tx');

const MinimumArchwaydVersion = '1.0.0-rc.2';
const DefaultArchwaydHome = `${process.env.HOME}/.archway`;

class ArchwayClientError extends Error {
  #stderr;

  constructor(stderr) {
    super(`Failed to run archwayd: ${stderr}`);
    this.name = 'ArchwayClientError';
    this.#stderr = stderr;
  }

  get stderr() {
    return this.#stderr;
  }
}

class ValidationError extends Error {}

class TxCancelledError extends Error {}

/**
 * Facade for the archwayd client, which supports both Docker and binary implementations.
 */
class ArchwayClient {
  #archwaydHome;
  #archwaydVersion;
  #extraArgs;
  #keys;
  #query;
  #tx;

  /**
   * @param {{ archwaydHome: string, archwaydVersion: string, extraArgs: string[] }} options
   */
  constructor({ archwaydHome = DefaultArchwaydHome, archwaydVersion = MinimumArchwaydVersion, extraArgs = [] } = {}) {
    this.#archwaydHome = archwaydHome;
    this.#archwaydVersion = archwaydVersion;
    this.#extraArgs = extraArgs;
    this.#keys = new KeysCommands(this);
    this.#query = new QueryCommands(this);
    this.#tx = new TxCommands(this);

    debug('ArchwayClient initialized', 'home=', this.archwaydHome, 'version=', this.archwaydVersion);
  }

  /**
   * Factory for creating an ArchwayClient.
   *
   * @param {{ archwaydHome: string, archwaydVersion: string, extraArgs: string[] }} options
   * @returns {ArchwayClient}
   */
  static async createClient(options = {}) {
    const client = new ArchwayClient(options);
    await client.validateVersion();
    return client;
  }

  get command() {
    return 'archwayd';
  }

  get archwaydHome() {
    return this.#archwaydHome;
  }

  get archwaydVersion() {
    return this.#archwaydVersion;
  }

  /**
   * @type {string[]}
   */
  get extraArgs() {
    return this.#extraArgs;
  }

  get workingDir() {
    return '.';
  }

  /**
   * @type {KeysCommands}
   */
  get keys() {
    return this.#keys;
  }

  /**
   * @type {QueryCommands}
   */
  get query() {
    return this.#query;
  }

  /**
   * @type {TxCommands}
   */
  get tx() {
    return this.#tx;
  }

  parseArgs(args = []) {
    return [...this.extraArgs, ...args];
  }

  run(subCommand, args = [], options = { stdio: 'inherit' }) {
    try {
      const command = this.command;
      const parsedArgs = this.parseArgs([subCommand, ...args]);
      options = { ...options, encoding: 'utf8' };
      debug(...parsedArgs);
      return spawn(command, parsedArgs, options);
    } catch (e) {
      throw new ArchwayClientError(e.message || e);
    }
  }

  async runJson(subCommand, args = [], { printOutput = true, ...options } = {}) {
    try {
      const archwayd = this.run(subCommand, [...args, '--output', 'json'], {
        stdio: ['inherit', 'pipe', 'pipe'],
        maxBuffer: 1024 * 1024,
        ...options,
      });

      if (printOutput) {
        archwayd.stdout?.pipe(process.stdout);
        archwayd.stderr?.pipe(process.stderr);
      }

      const { stdout, stderr } = await archwayd;
      debug('stdout=', stdout, 'stderr=', stderr);

      const isCancelled = findLine(stderr, line => /cancelled transaction/i.test(line));
      if (!_.isEmpty(isCancelled)) {
        throw new TxCancelledError();
      }

      const jsonOutput = findLine(stdout, line => /^{.*}/i.test(line)) || '{}';
      return JSON.parse(jsonOutput);
    } catch (e) {
      debug('error:', e);
      if (e instanceof TxCancelledError) {
        throw e;
      }
      const error = findLine(e.stderr, line => /^error:/i.test(line)) || e.message;
      throw new ArchwayClientError(error);
    }
  }

  /**
   * Gets the archway client version.
   *
   * @returns {Promise<string>} the version of the installed archwayd client.
   */
  async getVersion() {
    const { stdout } = await this.run('version', [], { stdio: ['inherit', 'pipe', 'inherit'] });
    return findLine(stdout, semver.valid);
  }

  /**
   * Validates if the installed version of archwayd is compatible with the client.
   *
   * @throws {ValidationError} if the version is not compatible.
   */
  async validateVersion() {
    if (semver.valid(this.archwaydVersion) === null) {
      throw new ValidationError(`Invalid Archwayd version: ${this.archwaydVersion}`);
    }

    if (semver.lt(this.archwaydVersion, MinimumArchwaydVersion)) {
      throw new ValidationError(
        `The archwayd version specified in your config file is not compatible with the CLI.
        Minimum version required: ${MinimumArchwaydVersion}
        Version in config.json: ${this.archwaydVersion}
        Check your config.json file and update it accordingly using the \`archway network -m\` command.`
      );
    }

    const binVersion = await this.getVersion();
    if (!_.isEmpty(binVersion) && semver.lt(binVersion, this.archwaydVersion)) {
      throw new ValidationError(
        `The archwayd version installed is not compatible with the network.
        Minimum version required by the config file: ${this.archwaydVersion}
        Current archwayd version: ${this.binVersion}
        Please install the latest version from https://github.com/archway-network/archway`
      );
    }

    debug('required version=', this.archwaydVersion, 'binary version=', binVersion);
  }
}

function findLine(output, testFn) {
  if (!output) {
    return undefined;
  }
  const lines = output.replace(/\r/g, '').split('\n');
  return lines.find(testFn);
}

module.exports = {
  ArchwayClient,
  DefaultArchwaydHome,
  MinimumArchwaydVersion,
  ArchwayClientError,
  ValidationError,
  TxCancelledError,
  TxExecutionError,
  getTxEventAttribute: QueryCommands.getTxEventAttribute,
  assertValidTx: TxCommands.assertValidTx,
  createClient: ArchwayClient.createClient,
};
