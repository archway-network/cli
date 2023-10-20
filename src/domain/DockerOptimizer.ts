import path from 'node:path';

import debugInstance from 'debug';
import Docker from 'dockerode';
import ora from 'ora';

import { cyan, dim } from '@/utils';

const debug = debugInstance('docker-optimizer');

const CtrlC = '\u0003';

export class OptimizerError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = 'DockerOptimizerError';
  }

  static fromError(error: Error): OptimizerError {
    return new OptimizerError(error.message);
  }

  static fromStatusCode(statusCode: number): OptimizerError {
    const message = OptimizerError.statusCodeToMessage(statusCode);
    return new OptimizerError(message, statusCode);
  }

  private static statusCodeToMessage(statusCode: number): string {
    switch (statusCode) {
      case 137:
        return 'Process killed by the user';
      default:
        return `Process exited with status code ${statusCode}`;
    }
  }
}

/**
 * Wraps the rust-optimizer docker image and executes the proper optimizer for single projects or workspaces.
 */
export class DockerOptimizer {
  static RustOptimizerImage = 'cosmwasm/rust-optimizer';
  static WorkspaceOptimizerImage = 'cosmwasm/workspace-optimizer';
  static Version = '0.14.0';

  /**
   * Docker instance
   */
  private docker: Docker;

  /**
   * @param options - Optional - Docker options
   */
  constructor(options: Docker.DockerOptions = {}) {
    this.docker = new Docker(options);
  }

  /**
   * Runs a docker container to optimize the wasm file.
   *
   * @param workspaceRoot - Path where the workspace is located
   * @param contractRoot - Path where a single contract is located
   * @param quiet - If true, it will not print any output
   */
  async run(workspaceRoot: string, contractRoot?: string, quiet = false): Promise<void> {
    try {
      await this.docker.ping();
    } catch (error: any) {
      throw new Error(error);
    }

    const { containerName, container } = await this.createContainer(workspaceRoot, contractRoot, quiet);
    debug('run', 'container created', { name: containerName, id: container.id });

    const resetStream = await this.attachToStream(container, quiet);

    try {
      const startResult = await container.start();
      debug('run', 'container started', { name: containerName, id: container.id, startResult });

      resizeTty(container);
      process.stdout.on('resize', () => resizeTty(container));

      const { Error: error, StatusCode: statusCode } = await container.wait();
      if (statusCode !== 0) {
        throw error instanceof Error ? OptimizerError.fromError(error) : OptimizerError.fromStatusCode(statusCode);
      }
    } finally {
      resetStream();
    }
  }

  /**
   * Creates a docker container. If a container with the same name is already running,
   * it kills the existing container before creating a new one.
   *
   * @param workspaceRoot - Path where the workspace is located.
   * @param contractRoot - Path where a single contract is located.
   * @param quiet - If true, it will not print any output.
   * @returns A promise containing the container name and a {@link Docker.Container} instance.
   */
  private async createContainer(
    workspaceRoot: string,
    contractRoot?: string,
    quiet = false,
  ): Promise<{ containerName: string, container: Docker.Container }> {
    const useWorkspace = !contractRoot;
    const image = await this.fetchImage(useWorkspace, quiet);
    const projectName = path.basename(workspaceRoot);
    const containerName = `${projectName}-optimizer`;

    await this.killIfRunning(containerName, quiet);

    const cmd = contractRoot ? [path.relative(workspaceRoot, contractRoot)] : [];
    const createOptions = {
      name: containerName,
      Image: image,
      Cmd: cmd,
      Tty: false,
      OpenStdin: true,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      StdinOnce: false,
      Env: [
        'CARGO_TERM_COLOR=always',
        'RUST_BACKTRACE=1'
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
          `${projectName}_cache:/target`,
          'cosmwasm_sccache:/root/.cache/sccache',
          'cosmwasm_registry_cache:/usr/local/cargo/registry',
        ],
      },
    };

    debug('createContainer', { createOptions });
    const container = await this.docker.createContainer(createOptions);

    return { containerName, container };
  }

  /**
   * Kills a container if it is running.
   *
   * @param container - Name of the container to kill.
   */
  private async killIfRunning(containerName: string, quiet: boolean = false) {
    debug('killIfRunning', 'checking if container is running', { name: containerName });
    const container = this.docker.getContainer(containerName);
    try {
      const { State: state } = await container.inspect();
      if (state.Running || state.Paused) {
        debug('killIfRunning', 'stopping and removing container', { name: containerName });

        const checkContainerStopped = async () => {
          await container.wait();

          // Sometimes, deleting the container takes an additional time
          while (true) {
            try {
              await container.inspect();
            } catch {
              break;
            }
          }
        };

        const stopped = checkContainerStopped();
        if (!quiet) {
          ora.promise(stopped, {
            text: `${dim('Waiting for container')} ${cyan.dim(containerName)} ${dim('to stop...')}`
          });
        }

        await container.remove({ v: true, force: true });
        await stopped;
      }
    } catch {
      debug('killIfRunning', 'container not found', { name: containerName });
    }
  }

  /**
   * Resolves the correct image to use and pulls it if not available locally.
   *
   * @param useWorkspaceImage - Fetch the workspace image instead of the single rust image
   * @returns Promise containing the image name
   */
  private async fetchImage(useWorkspaceImage = false, quiet = false): Promise<string> {
    const name = useWorkspaceImage ? DockerOptimizer.WorkspaceOptimizerImage : DockerOptimizer.RustOptimizerImage;
    const image = `${name}:${DockerOptimizer.Version}`;
    debug('fetchImage', 'searching for image locally', { image });
    const images: Docker.ImageInfo[] = await this.docker.listImages({
      filters: { reference: [image] },
    } as unknown as Docker.ListImagesOptions);
    if (images.length === 0) {
      const pull = this.pullImage(image);
      if (!quiet) {
        ora.promise(pull, { text: `${dim('Pulling docker image')} ${cyan(`${image}...`)}` });
      }

      await pull;
    }

    return image;
  }

  /**
   * Pulls a docker image.
   *
   * @param image - Image name and tag in the format `name:tag`.
   * @returns the pull stream output.
   */
  private async pullImage(image: string) {
    debug('pullImage', 'downloading image', { image });

    return new Promise((resolve, reject) => {
      this.docker.pull(image, (err: Error, stream: any) => {
        if (err) {
          reject(err);
        }

        this.docker.modem.followProgress(stream, (err, output) => {
          if (err) {
            reject(err);
          }

          resolve(output);
        });
      });
    });
  }

  /**
   * Attaches to the container input/output stream.
   *
   * @param container - The container to attach to the input/output stream.
   * @param quiet - If true, it will not print any output.
   * @returns A promise containing a function to reset the stream.
   */
  private async attachToStream(container: Docker.Container, quiet: boolean) {
    var attachOptions = {
      stream: true,
      stdin: true,
      stdout: true,
      stderr: true,
    };
    const stream = await container.attach(attachOptions);

    return configureStreamAndInput(container, stream, quiet);
  }
}

function configureStreamAndInput(
  container: Docker.Container,
  stream: NodeJS.ReadWriteStream,
  quiet: boolean,
): () => void {
  if (!quiet) {
    container.modem.demuxStream(stream, process.stdout, process.stderr);
  }

  const isRaw = process.stdin.isRaw;

  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.setRawMode(true);
  process.stdin.pipe(stream);

  process.stdin.on('data', async (key: string) => {
    // Kill container
    if (key == CtrlC) {
      debug('killing container', { id: container.id });
      await container.kill();
    }
  });

  const resetStream = () => {
    process.stdout.removeListener('resize', resizeTty);
    process.stdin.removeAllListeners();
    process.stdin.setRawMode(isRaw);
    process.stdin.resume();
    stream.end();
  }

  return resetStream;
}

async function resizeTty(container: Docker.Container): Promise<void> {
  var dimensions = {
    h: process.stdout.rows || 0,
    w: process.stdout.columns || 0
  };

  debug('resizing container tty', { id: container.id, dimensions });

  if (dimensions.h > 0 && dimensions.w > 0) {
    await container.resize(dimensions);
  }
}
