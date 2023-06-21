const debug = require('debug')('archwayd');
const { spawn } = require('promisify-child-process');

const KeysCommands = require('./keys');
const QueryCommands = require('./query');
const TxCommands = require('./tx');

const DefaultArchwaydVersion = '0.6.0';
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

/**
 * Facade for the archwayd client, which supports both Docker and binary implementations.
 */
class ArchwayClient {
  #archwaydHome;
  #extraArgs;
  #keys;
  #query;
  #tx;

  constructor({ archwaydHome = DefaultArchwaydHome, extraArgs = [] } = {}) {
    this.#archwaydHome = archwaydHome;
    this.#extraArgs = extraArgs;
    this.#keys = new KeysCommands(this);
    this.#query = new QueryCommands(this);
    this.#tx = new TxCommands(this);
  }

  get command() {
    return 'archwayd';
  }

  get archwaydHome() {
    return this.#archwaydHome;
  }

  get extraArgs() {
    return this.#extraArgs;
  }

  get workingDir() {
    return '.';
  }

  get keys() {
    return this.#keys;
  }

  get query() {
    return this.#query;
  }

  get tx() {
    return this.#tx;
  }

  parseArgs(args = []) {
    return [...this.extraArgs, ...args];
  }

  run(subCommand, args = [], options = { stdio: 'inherit' }) {
    const command = this.command;
    const parsedArgs = this.parseArgs([subCommand, ...args]);
    debug(...parsedArgs);
    return spawn(command, parsedArgs, { ...options, encoding: 'utf8' });
  }

  async runJson(
    subCommand,
    args = [],
    { printStdout = true, ...options } = {}
  ) {
    try {
      const archwayd = this.run(subCommand, [...args, '--output', 'json'], {
        stdio: ['inherit', 'pipe', 'pipe'],
        maxBuffer: 1024 * 1024,
        ...options,
      });

      if (printStdout) {
        archwayd.stdout?.pipe(process.stdout);
        archwayd.stderr?.pipe(process.stderr);
      }

      const { stdout } = await archwayd;
      const lines = stdout.replace(/\r/g, '').split('\n');
      const jsonLines = lines.filter(line => line.startsWith('{'));
      const jsonOutput = jsonLines.pop() || '{}';
      return JSON.parse(jsonOutput);
    } catch (e) {
      throw new ArchwayClientError(e.stderr);
    }
  }
}

class DockerArchwayClient extends ArchwayClient {
  constructor({ archwaydVersion = DefaultArchwaydVersion, ...options } = {}) {
    super(options);
    this.archwaydVersion = archwaydVersion;
  }

  get command() {
    return 'docker';
  }

  get workingDir() {
    return this.archwaydHome;
  }

  get extraArgs() {
    const dockerArgs = DockerArchwayClient.#getDockerArgs(
      this.workingDir,
      `v${this.archwaydVersion}`
    );
    return [...dockerArgs, ...super.extraArgs];
  }

  static #getDockerArgs(archwaydHome, archwaydVersion) {
    return [
      'run',
      '--rm',
      '-it',
      `--volume=${archwaydHome}:/root/.archway`,
      '--network=host',
      `archwaynetwork/archwayd:${archwaydVersion}`,
    ];
  }
}

/**
 * Factory for creating an ArchwayClient.
 *
 * @param {{ docker: bool, archwaydVersion: string, testnet: string, archwaydHome: string, extraArgs: array }} options
 * @returns {ArchwayClient}
 */
function clientFactory({ docker = false, ...options } = {}) {
  if (docker) {
    return new DockerArchwayClient(options);
  } else {
    return new ArchwayClient(options);
  }
}

module.exports = Object.assign(ArchwayClient, {
  DefaultArchwaydHome,
  DefaultArchwaydVersion,
  ArchwayClientError,
  createClient: clientFactory,
});
