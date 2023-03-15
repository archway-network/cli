const chalk = require('chalk');
const ora = require('ora');
const debug = require('debug')('wasm-optimizer');
const { WritableStream } = require('node:stream/web');
const path = require('node:path');
const Docker = require('dockerode');

/**
 * Wraps the rust-optimizer docker image and executes the proper optimizer for single projects or workspaces.
 */
class WasmOptimizer {
  static RustOptimizerImage = 'cosmwasm/rust-optimizer';
  static WorkspaceOptimizerImage = 'cosmwasm/workspace-optimizer';
  static Version = '0.12.12';

  /**
   * @type {Docker}
   */
  #docker;

  /**
   * @param {Docker.DockerOptions} options
   */
  constructor(options = {}) {
    this.#docker = new Docker(options);
  }

  /**
   * Runs a docker container to optimize the wasm file.
   *
   * @param {string} workspaceRoot
   * @param {boolean} isWorkspace
   * @returns {Promise<{ error: Error, statusCode: number }>}
   */
  async run(workspaceRoot, isWorkspace = false) {
    try {
      await this.#docker.ping();
    } catch (e) {
      throw new Error('Docker is not running. Please start Docker and try again.');
    }

    const image = await this.#fetchImage(isWorkspace);
    const projectName = path.basename(workspaceRoot);
    const containerName = `${projectName}-optimizer`;
    await this.#killIfRunning(containerName);

    const createOptions = {
      name: containerName,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      Env: [
        'CARGO_TERM_COLOR=always',
        'RUST_BACKTRACE=1',
      ],
      Volumes: {
        '/code': {},
        '/code/target': {},
        '/root/.cache/sccache': {},
        '/usr/local/cargo/registry': {},
      },
      HostConfig: {
        AutoRemove: true,
        Binds: [
          `${workspaceRoot}:/code`,
          `${projectName}_cache:/code/target`,
          'cosmwasm_sccache:/root/.cache/sccache',
          'registry_cache:/usr/local/cargo/registry',
        ],
      },
    };
    debug('run', image, [], createOptions);

    const stdout = createPipe(process.stdout);
    const stderr = createPipe(process.stderr);

    const [{ Error: error, StatusCode: statusCode }] = await this.#docker.run(
      image,
      [],
      [stdout, stderr],
      createOptions
    );

    return { error, statusCode };
  }

  /**
   * Kills a container if it is running.
   *
   * @param {string} containerName Name of the container to kill.
   */
  async #killIfRunning(containerName) {
    debug('killIfRunning', 'checking if container is running', containerName);
    const container = this.#docker.getContainer(containerName);
    try {
      const info = await container.inspect();
      if (info.State.Running) {
        const kill = container.kill();
        ora.promise(kill, { text: chalk`{dim Killing running container {cyan ${containerName}}...}` });
        await kill;
      }
    } catch (e) {
      debug('killIfRunning', 'container not found', containerName);
    }
  }

  /**
   * Resolves the correct image to use and pulls it if it is not available locally.
   *
   * @param {boolean} isWorkspace
   * @returns {Promise<string>}
   */
  async #fetchImage(isWorkspace) {
    const name = (isWorkspace ? WasmOptimizer.WorkspaceOptimizerImage : WasmOptimizer.RustOptimizerImage) +
      (process.arch === 'arm64' ? '-arm64' : '');
    const image = `${name}:${WasmOptimizer.Version}`;
    debug('fetchImage', 'searching for image locally', image);
    const images = await this.#docker.listImages({ filters: { reference: [image] } });
    if (images.length === 0) {
      const pull = this.#pullImage(image);
      ora.promise(pull, { text: chalk`{dim Pulling docker image {cyan ${image}}...}` });
      await pull;
    }

    return image;
  }

  /**
   * Pulls a docker image.
   *
   * @param {string} image Image name and tag in the format `name:tag`.
   * @returns the pull stream output.
   */
  async #pullImage(image) {
    debug('pullImage', 'downloading image', image);
    return await new Promise((resolve, reject) => {
      this.#docker.pull(image, (err, stream) => {
        if (err) {
          reject(err);
        }

        this.#docker.modem.followProgress(stream, (err, output) => {
          if (err) {
            reject(err);
          }
          resolve(output);
        });
      });
    });
  }
}

function createPipe(stream) {
  const writable = new WritableStream({
    write(chunk) {
      stream.write(chunk);
    },
  });

  return writable.getWriter();
}

module.exports = WasmOptimizer;
