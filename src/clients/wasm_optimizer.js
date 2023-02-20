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
  static Version = '0.12.11';

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
   * @returns {Promise<{ error, statusCode }>}
   */
  async run(workspaceRoot, isWorkspace = false) {
    try {
      await this.#docker.ping();
    } catch (e) {
      throw new Error('Docker is not running. Please start Docker and try again.');
    }

    const image = `${isWorkspace ? WasmOptimizer.WorkspaceOptimizerImage : WasmOptimizer.RustOptimizerImage}:${WasmOptimizer.Version}`;
    const projectName = path.basename(workspaceRoot);
    const createOptions = {
      name: `${projectName}-optimizer`,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      Env: ['CARGO_TERM_COLOR=always'],
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
