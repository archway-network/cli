const chalk = require('chalk');
const { prompts, PromptCancelledError } = require('../util/prompts');
const { spawn } = require('promisify-child-process');
const { pathExists, mv } = require('../util/fs');

const DefaultArchwaydVersion = 'latest';
const DefaultArchwaydHome = `${process.env.HOME}/.archway`;

/**
 * Facade for the archwayd client, which supports both Docker and binary implementations.
 */
class DefaultArchwayClient {
  #extraArgs;

  constructor({ archwaydHome = DefaultArchwaydHome, extraArgs = [], ...options }) {
    this.archwaydHome = archwaydHome;
    this.#extraArgs = extraArgs;
    this.options = options;
  }

  command() {
    return 'archwayd';
  }

  extraArgs() {
    return this.#extraArgs;
  }

  workingDir() {
    return '.';
  }

  parseArgs(args = []) {
    return [...this.extraArgs(), ...args];
  }

  async run(subCommand, args = [], options = { stdio: 'inherit' }) {
    const command = this.command();
    const parsedArgs = this.parseArgs([subCommand, ...args]);
    return spawn(command, parsedArgs, { ...options, encoding: 'utf8' });
  }
}

class DockerArchwayClient extends DefaultArchwayClient {
  constructor({ archwaydVersion = DefaultArchwaydVersion, testnet, ...options }) {
    super(options);
    this.archwaydVersion = testnet || archwaydVersion;
  }

  command() {
    return 'docker';
  }

  workingDir() {
    return this.archwaydHome;
  }

  extraArgs() {
    const dockerArgs = DockerArchwayClient.#getDockerArgs(this.archwaydHome, this.archwaydVersion);
    return [...dockerArgs, ...super.extraArgs()];
  }

  static #getDockerArgs(archwaydHome, archwaydVersion) {
    return [
      'run',
      '--rm',
      '-it',
      `--volume=${archwaydHome}:/root/.archway`,
      `archwaynetwork/archwayd:${archwaydVersion}`
    ];
  }

  async checkHomePath() {
    const oldArchwayHome = '/var/tmp/.archwayd';
    if (this.archwaydHome === oldArchwayHome || !await pathExists(oldArchwayHome)) {
      return;
    }

    const questions = [
      {
        type: 'confirm',
        name: 'move',
        message: chalk`I've found a keystore in {cyan ${oldArchwayHome}}. Would you like to move it to {cyan ${this.archwaydHome}}?`,
        initial: true
      }, {
        type: async prev => prev && await pathExists(this.archwaydHome) ? 'confirm' : null,
        name: 'overwrite',
        message: chalk`The directory {cyan ${this.archwaydHome}} is not empty. Would you like to overwrite its contents?`,
        initial: true
      }
    ];

    try {
      const { move, overwrite } = await prompts(questions);

      if (move) {
        await mv(oldArchwayHome, this.archwaydHome, overwrite);
      }
    } catch (e) {
      if (e instanceof PromptCancelledError) {
        console.warn(chalk`{yellow Cancelled moving keystore}`);
      } else {
        console.error(`Failed to move directory: ${e.message || e}\n`);
      }
    } finally {
      console.info();
    }
  }
}

async function clientFactory({ docker = false, checkHomePath = false, ...options } = {}) {
  if (docker) {
    const client = new DockerArchwayClient(options);
    if (checkHomePath) {
      await client.checkHomePath();
    }
    return client;
  } else {
    return new DefaultArchwayClient(options);
  }
}

module.exports = {
  DefaultArchwaydHome,
  DefaultArchwaydVersion,
  createClient: clientFactory
};
