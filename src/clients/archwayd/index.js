const debug = require('debug')('archwayd');
const semver = require('semver');
const { spawn } = require('promisify-child-process');

const KeysCommands = require('./keys');
const QueryCommands = require('./query');
const TxCommands = require('./tx');

const MinimumArchwaydVersion = '0.5.2';
const DefaultArchwaydHome = `${process.env.HOME}/.archway`;

class ArchwayClientError extends Error {
  constructor(stderr) {
    super('Failed to run archwayd');
    this.name = 'ArchwayClientError';
    this.stderr = stderr;
  }

  toString() {
    return `${this.message}\n${this.stderr}`;
  }
}

class ValidationError extends Error {}

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

  constructor({ archwaydHome = DefaultArchwaydHome, archwaydVersion = MinimumArchwaydVersion, extraArgs = [] } = {}) {
    this.#archwaydHome = archwaydHome;
    this.#archwaydVersion = archwaydVersion;
    this.#extraArgs = extraArgs;
    this.#keys = new KeysCommands(this);
    this.#query = new QueryCommands(this);
    this.#tx = new TxCommands(this);

    debug('ArchwayClient initialized', 'home=', this.archwaydHome, 'version=', this.archwaydVersion);
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

  get extraArgs() {
    return this.#extraArgs;
  }

  get workingDir() {
    return '.';
  }

  /***
   * @type {KeysCommands}
   */
  get keys() {
    return this.#keys;
  }

  /***
   * @type {QueryCommands}
   */
  get query() {
    return this.#query;
  }

  /***
   * @type {TxCommands}
   */
  get tx() {
    return this.#tx;
  }

  parseArgs(args = []) {
    return [...this.extraArgs, ...args];
  }

  run(subCommand, args = [], options = { stdio: 'inherit' }) {
    const command = this.command;
    const parsedArgs = this.parseArgs([subCommand, ...args]);
    options = { ...options, encoding: 'utf8' };
    debug(command, ...parsedArgs);
    return spawn(command, parsedArgs, options);
  }

  async runJson(subCommand, args = [], { printStdout = true, ...options } = {}) {
    try {
      const archwayd = this.run(subCommand, [...args, '--output', 'json'], {
        stdio: ['inherit', 'pipe', 'pipe'],
        maxBuffer: 1024 * 1024,
        ...options,
      });

      if (printStdout) {
        archwayd.stdout?.pipe(process.stdout);
        archwayd.stderr?.pipe(process.stderr);
      } else {
        archwayd.stdout?.on('data', data => {
          // When the passphrase is requested by archwayd, we want to print it to stdout
          const message = data.toString().toLowerCase();
          if (message.includes('passphrase') || message.includes('error')) {
            process.stdout.write(data);
          }
        });
      }

      const { stdout } = await archwayd;
      const lines = stdout.replace(/\r/g, '').split('\n');
      const jsonLines = lines.filter(line => line.startsWith('{'));
      const jsonOutput = jsonLines.pop() || '{}';
      return JSON.parse(jsonOutput);
    } catch (e) {
      const error = e.stderr || e.message;
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
    const lines = stdout.replace(/\r/g, '').split('\n');
    return lines.find(semver.valid);
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
        `The archwayd version specified in your config.json file is not compatible with the CLI.
        Minimum version required: ${MinimumArchwaydVersion}
        Current version: ${this.archwaydVersion}
        Check your config.json file and update it accordingly using the \`archway network -m\` command.`
      );
    }

    const binVersion = await this.getVersion();
    if (binVersion !== undefined && semver.valid(binVersion) !== null && semver.lt(binVersion, this.archwaydVersion)) {
      throw new ValidationError(
        `The archwayd version installed is not compatible with the CLI.
        Minimum version required: ${MinimumArchwaydVersion}
        Current archwayd version: ${this.archwaydVersion}
        Check your config.json file and update it accordingly.`
      );
    }
  }
}

class DockerArchwayClient extends ArchwayClient {
  get command() {
    return 'docker';
  }

  get workingDir() {
    return this.archwaydHome;
  }

  get extraArgs() {
    const validVersion = semver.valid(this.archwaydVersion);
    const imageTag = validVersion !== null ? `v${validVersion}` : this.archwaydVersion;
    const dockerArgs = DockerArchwayClient.#getDockerArgs(this.workingDir, imageTag);
    return [...dockerArgs, ...super.extraArgs];
  }

  /**
   * Returns the version of the docker image because the `archway version` command in the image returns an empty string.
   *
   * @returns {string} the version of the docker image
   */
  getVersion() {
    return this.archwaydVersion;
  }

  static #getDockerArgs(archwaydHome, imageTag) {
    return [
      'run',
      '--rm',
      '-it',
      `--volume=${archwaydHome}:/root/.archway`,
      '--network=host',
      `archwaynetwork/archwayd:${imageTag}`,
    ];
  }
}

/**
 * Factory for creating an ArchwayClient.
 *
 * @param {{ docker: bool, archwaydVersion: string, testnet: string, archwaydHome: string, extraArgs: array }} options
 * @returns {ArchwayClient}
 */
async function createClient({ docker = false, ...options } = {}) {
  const client = docker ? new DockerArchwayClient(options) : new ArchwayClient(options);
  await client.validateVersion();
  return client;
}

module.exports = {
  ArchwayClient,
  DockerArchwayClient,
  DefaultArchwaydHome,
  MinimumArchwaydVersion,
  ArchwayClientError,
  ValidationError,
  getTxEventAttribute: QueryCommands.getTxEventAttribute,
  createClient,
};
