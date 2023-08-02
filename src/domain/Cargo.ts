import _ from 'lodash';
import path from 'node:path';
import { ChildProcessPromise, PromisifySpawnOptions, spawn } from 'promisify-child-process';

import { BuildParams, CargoProjectMetadata, GenerateParams, Metadata } from '@/types/Cargo';
import { ConsoleError } from '@/types/ConsoleError';
import { ErrorCodes } from '@/exceptions/ErrorCodes';
import { bold, red } from '@/utils/style';

/**
 * Facade Class for the cargo shell command
 */
export class Cargo {
  static WasmTarget = 'wasm32-unknown-unknown';

  // eslint-disable-next-line no-useless-constructor
  constructor(public workingDir = process.cwd()) {}

  /**
   * Get absolute path of the project location
   *
   * @returns Path of the cargo project
   */
  async locateProject(): Promise<string> {
    const { stdout } = await this.run(['locate-project', '--message-format', 'plain'], { stdio: 'pipe' });
    return path.dirname(stdout?.toString() || '');
  }

  /**
   * Generate a new cargo project, from a template in a git repository
   *
   * @param params - Object of type {@link GenerateParams}
   */
  async generate(params: GenerateParams): Promise<void> {
    const extraArgs = [
      ['--name', params.name],
      ['--git', params.repository],
      ['--branch', params.branch],
      params.destinationDir ? ['--destination', params.destinationDir] : [],
      [params.template],
    ].flat();
    await this.run(['generate', ...extraArgs]);
  }

  /**
   * Build a cargo project
   *
   * @param params - Object of type {@link BuildParams}
   */
  async build(params: BuildParams): Promise<void> {
    const extraArgs = [
      params.release ? ['--release'] : [],
      params.locked ? ['--locked'] : [],
      params.target ? ['--target', params.target] : [],
    ].flat();
    await this.run(['build', ...extraArgs], params.options);
  }

  /**
   * Build the project with a wasm target
   */
  async wasm(): Promise<void> {
    await this.build({
      release: true,
      locked: true,
      target: Cargo.WasmTarget,
      options: { env: { ...process.env, RUSTFLAGS: '-C link-arg=-s' } },
    });
  }

  /**
   * Returns the cargo file metadata in a JSON object
   *
   * @returns Object of type {@link Metadata}
   */
  async metadata(): Promise<Metadata> {
    const { stdout } = await this.run(['metadata', '--quiet', '--no-deps', '--format-version=1'], { stdio: 'pipe' });
    return JSON.parse(stdout?.toString() || '');
  }

  /**
   * Parses the project metadata.
   * If ran from a workspace, it will return the first package in the workspace.
   * If ran from a package folder, it will return the current package metadata.
   *
   * @returns Promise containing object of type {@link ProjectMetadata}
   */
  async projectMetadata(): Promise<CargoProjectMetadata> {
    const { packages = [], target_directory: targetDirectory, workspace_root: workspaceRoot } = await this.metadata();
    const currentManifestPath = await this.locateProject();

    const findPackageInPath = (searchPath: string) =>
      packages.find(({ manifest_path: manifestPath }) => path.dirname(manifestPath) === searchPath);

    const firstPackageInWorkspace = (searchPath: string) => (workspaceRoot === searchPath ? _.head(packages) : undefined);

    const {
      name,
      version,
      manifest_path: manifestPath,
    } = findPackageInPath(currentManifestPath) || firstPackageInWorkspace(currentManifestPath) || {};

    if (!name || !version) {
      throw new CargoMetadataError(this.workingDir);
    }

    const label = `${name}-${version}`;
    const root = path.dirname(manifestPath || '');
    const wasmFileName = `${name.replace(/-/g, '_')}.wasm`;
    const wasm = {
      fileName: wasmFileName,
      filePath: path.join(targetDirectory, Cargo.WasmTarget, 'release', wasmFileName),
      optimizedFilePath: path.join(workspaceRoot, 'artifacts', wasmFileName),
    };

    return { name, label, version, wasm, root, workspaceRoot };
  }

  /**
   * Runs the cargo shell command
   *
   * @param args - Array of arguments to be passed to the cargo command
   * @param options - Node child process options
   * @returns - Output of command, with classs {@link ChildProcessPromise} that contains stdout, and stderr
   */
  private run(args: string[], options?: PromisifySpawnOptions): ChildProcessPromise {
    return spawn('cargo', args, {
      stdio: 'inherit',
      ...options,
      cwd: this.workingDir,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024, // (Large enough for verbose error debugging)
    });
  }
}

/**
 * Error when project metadata can't be resolved
 */
export class CargoMetadataError extends ConsoleError {
  /**
   * @param workingDir - Optional - Path from where the project metadata was attempted to load
   */
  constructor(public workingDir?: string) {
    super(ErrorCodes.CARGO_METADATA_ERROR);
  }

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    return `${red('Failed to resolve project metadata')}${this.workingDir ? bold(` from ${this.workingDir}`) : ''}`;
  }
}
