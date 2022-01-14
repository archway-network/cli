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
    const command = this.getCommand();
    const parsedArgs = this.parseArgs([subCommand, ...args]);
    return spawn(command, parsedArgs, { stdio: ['inherit', 'pipe', 'pipe'] });
  }
}

class DockerArchwayClient extends DefaultArchwayClient {
  constructor({
    archwaydHome = DefaultArchwaydHome,
    archwaydVersion = DefaultArchwaydVersion,
    checkHomePath = false,
    ...options
  }) {
    super(options);
    this.archwaydHome = archwaydHome;
    this.archwaydVersion = archwaydVersion;

    if (checkHomePath) {
      DockerArchwayClient.#checkHomePath(this.archwaydHome);
    }
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

  static async #checkHomePath(archwaydHome) {
    const oldArchwayHome = '/var/tmp/.archwayd';
    if (archwaydHome === oldArchwayHome || !await pathExists(oldArchwayHome)) {
      return;
    }

    const newPathExists = await pathExists(archwaydHome);
    const { move, overwrite } = await prompts({
      type: 'confirm',
      name: 'move',
      message: `I've found a keystore in ${oldArchwayHome}. Would you like to move it to ${archwaydHome}?`,
      initial: true
    }, {
      type: prev => prev && newPathExists ? 'confirm' : null,
      name: 'overwrite',
      message: `The directory ${archwaydHome} is not empty. Would you like to overwrite its contents?`,
      initial: true
    });

    if (move) {
      try {
        await mv(oldArchwayHome, archwaydHome, overwrite);
      } catch (error) {
        console.error(`Failed to move directory: ${error.message}\n`);
      }
    }
  }
}

function clientFactory({ docker = false, ...options } = {}) {
  if (docker) {
    return new DockerArchwayClient(options);
  } else {
    return new DefaultArchwayClient(options);
  }
}

module.exports = {
  DefaultArchwaydHome,
  DefaultArchwaydVersion,
  buildClient: clientFactory
};
