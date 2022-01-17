const { spawn } = require('child_process');
const prompts = require('prompts');
const { pathExists, mv } = require('../util/fs');

const DefaultArchwaydVersion = '0.0.1';
const DefaultArchwaydHome = `${process.env.HOME}/.archway`;

/**
 * Facade for the archwayd client, which supports both Docker and binary implementations.
 */
class DefaultArchwayClient {
  #extraArgs;

  constructor({ extraArgs = [], ...options }) {
    this.#extraArgs = extraArgs;
    this.options = options;
  }

  getCommand() {
    return 'archwayd';
  }

  getExtraArgs() {
    return this.#extraArgs;
  }

  getWorkingDir() {
    return '.';
  }

  parseArgs(args = []) {
    return [...this.getExtraArgs(), ...args];
  }

  async run(subCommand, ...args) {
    return this.#run(subCommand, args, { stdio: ['inherit', 'pipe', 'pipe'], });
  }

  async runPiped(subCommand, ...args) {
    return this.#run(subCommand, args, { stdio: 'pipe', });
  }

  async runInherited(subCommand, ...args) {
    return this.#run(subCommand, args, { stdio: 'inherit', });
  }

  async #run(subCommand, args, options) {
    const command = this.getCommand();
    const parsedArgs = this.parseArgs([subCommand, ...args]);
    return spawn(command, parsedArgs, options);
  }
}

class DockerArchwayClient extends DefaultArchwayClient {
  constructor({ archwaydHome = DefaultArchwaydHome, archwaydVersion = DefaultArchwaydVersion, ...options }) {
    super(options);
    this.archwaydHome = archwaydHome;
    this.archwaydVersion = archwaydVersion;
  }

  getCommand() {
    return 'docker';
  }

  getWorkingDir() {
    return this.archwaydHome;
  }

  getExtraArgs() {
    const dockerArgs = DockerArchwayClient.#getDockerArgs(this.archwaydHome, this.archwaydVersion);
    return [...dockerArgs, ...super.getExtraArgs()];
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

    const newPathExists = await pathExists(this.archwaydHome);
    const { move, overwrite } = await prompts({
      type: 'confirm',
      name: 'move',
      message: `I've found a keystore in ${oldArchwayHome}. Would you like to move it to ${this.archwaydHome}?`,
      initial: true
    }, {
      type: prev => prev && newPathExists ? 'confirm' : null,
      name: 'overwrite',
      message: `The directory ${this.archwaydHome} is not empty. Would you like to overwrite its contents?`,
      initial: true
    });

    if (move) {
      try {
        await mv(oldArchwayHome, this.archwaydHome, overwrite);
      } catch (error) {
        console.error(`Failed to move directory: ${error.message}\n`);
      }
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
