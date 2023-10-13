import path from 'node:path';
import stream from 'node:stream';
import { WritableStream } from 'node:stream/web';

import debugInstance from 'debug';
import Docker from 'dockerode';
import ora from 'ora';

import { cyan, dim } from '@/utils';

const debug = debugInstance('docker-optimizer');

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
  private _docker: Docker;

  /**
   * @param options - Optional - Docker options
   */
  constructor(options: Docker.DockerOptions = {}) {
    this._docker = new Docker(options);
  }

  /**
   * Runs a docker container to optimize the wasm file.
   *
   * @param workspaceRoot - Path where the workspace is located
   * @param contractRoot - Path where a single contract is located
   * @returns Promise containing the status code of the result and error if it exists
   */
  async run(workspaceRoot: string, contractRoot?: string, quiet = false): Promise<{ error?: Error | string; statusCode: number }> {
    try {
      await this._docker.ping();
    } catch (error: any) {
      throw new Error(error);
    }

    const image = await this.fetchImage(!contractRoot, quiet);
    const projectName = path.basename(workspaceRoot);
    const containerName = `${projectName}-optimizer`;

    await this.killIfRunning(containerName, quiet);

    const createOptions = {
      name: containerName,
      AttachStdin: !quiet,
      AttachStdout: !quiet,
      AttachStderr: !quiet,
      Tty: false,
      Env: ['CARGO_TERM_COLOR=always', 'RUST_BACKTRACE=1'],
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

    debug('run', image, [], createOptions, contractRoot);

    const outputStream = this.createOutputStream(quiet);
    const [{ Error: error, StatusCode: statusCode }] = await this._docker.run(
      image,
      contractRoot ? [path.relative(workspaceRoot, contractRoot)] : [],
      outputStream,
      createOptions
    );

    return { error, statusCode };
  }

  private createOutputStream(quiet: boolean): NodeJS.WritableStream | NodeJS.WritableStream[] {
    if (quiet) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return new stream.Writable({ write: () => {} });
    }

    const stdout = createPipe(process.stdout);
    const stderr = createPipe(process.stderr);

    return [stdout, stderr];
  }

  /**
   * Kills a container if it is running.
   *
   * @param container - Name of the container to kill.
   */
  private async killIfRunning(containerName: string, quiet = false) {
    debug('killIfRunning', 'checking if container is running', containerName);
    const container = this._docker.getContainer(containerName);
    try {
      const info = await container.inspect();
      if (info.State.Running) {
        const kill = container.kill();
        if (!quiet) {
          ora.promise(kill, { text: `${dim('Killing running container')} ${cyan(`${containerName}...`)}` });
        }

        await kill;
        await container.wait(); // Sometimes container takes additional milliseconds to be deleted
      }
    } catch {
      debug('killIfRunning', 'container not found', containerName);
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
    debug('fetchImage', 'searching for image locally', image);
    const images: Docker.ImageInfo[] = await this._docker.listImages({
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
    debug('pullImage', 'downloading image', image);

    return new Promise((resolve, reject) => {
      this._docker.pull(image, (err: Error, stream: any) => {
        if (err) {
          reject(err);
        }

        this._docker.modem.followProgress(stream, (err, output) => {
          if (err) {
            reject(err);
          }

          resolve(output);
        });
      });
    });
  }
}

function createPipe(stream: NodeJS.WriteStream): NodeJS.WritableStream {
  const writable = new WritableStream({
    write(chunk) {
      stream.write(chunk);
    },
  });

  return writable.getWriter() as unknown as NodeJS.WritableStream;
}
