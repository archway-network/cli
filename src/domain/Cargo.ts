
import path from 'node:path';

import debugInstance from 'debug';
import _ from 'lodash';
import { ChildProcessPromise, PromisifySpawnOptions, spawn } from 'promisify-child-process';

import { DockerOptimizer } from '@/domain';
import { ConsoleError, ErrorCodes } from '@/exceptions';
import { CargoProjectMetadata } from '@/types';
import { bold, redBright } from '@/utils';

const debug = debugInstance('cargo');

/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Cargo metadata information
 */
export interface Metadata {
  metadata: any;
  packages: Package[];
  resolve: any;
  target_directory: string;
  version: number;
  workspace_members: string[];
  workspace_root: string;
}

/**
 * Cargo package information
 */
export interface Package {
  authors: string[];
  categories: any[];
  default_run: any;
  dependencies: Dependency[];
  description: any;
  documentation: any;
  edition: string;
  features: Features;
  homepage: any;
  id: string;
  keywords: any[];
  license: any;
  license_file: any;
  links: any;
  manifest_path: string;
  metadata: PackageMetadata;
  name: string;
  publish: any;
  readme: string;
  repository: any;
  rust_version: any;
  source: any;
  targets: Target[];
  version: string;
}

/**
 * Cargo dependency information
 */
export interface Dependency {
  features: string[];
  kind?: string;
  name: string;
  optional: boolean;
  registry: any;
  rename: any;
  req: string;
  source: string;
  target: any;
  uses_default_features: boolean;
}

/**
 * Cargo target information
 */
export interface Target {
  crate_types: string[];
  doc: boolean;
  doctest: boolean;
  edition: string;
  kind: string[];
  name: string;
  src_path: string;
  test: boolean;
}

/**
 * Cargo features information
 */
export interface Features {
  backtraces: string[];
  library: any[];
}

/**
 * Cargo package metadata information
 */
export interface PackageMetadata {
  scripts: Scripts;
}

/**
 * Cargo package metadata scripts information
 */
export interface Scripts {
  optimize: string;
}

/**
 * Parameters for the {@link Cargo.generate} function
 */
interface GenerateParams {
  branch: string;
  destinationDir?: string;
  name: string;
  quiet?: boolean;
  repository: string;
  template: string;
}

/**
 * Parameters for the {@link Cargo.build} function
 */
interface BuildParams {
  lib?: boolean;
  locked?: boolean;
  quiet?: boolean;
  release?: boolean;
  target?: string;
}

/**
 * Parameters for the {@link Cargo.schema} function
 */
interface SchemaParams {
  quiet?: boolean;
}

interface OptimizeParams {
  all?: boolean;
  quiet?: boolean;
}

/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Facade Class for the cargo shell command
 */
export class Cargo {
  static WasmTarget = 'wasm32-unknown-unknown';
  static OptimizedOutputDir = 'artifacts';

  public readonly workingDir: string;

  constructor(workingDir = process.cwd()) {
    this.workingDir = workingDir;
  }

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
   * @returns void
   */
  async generate(params: GenerateParams): Promise<void> {
    const extraArgs = [
      ['--name', params.name],
      ['--git', params.repository],
      ['--branch', params.branch],
      params.destinationDir ? ['--destination', params.destinationDir] : [],
      [params.template],
    ].flat();
    await this.run(['generate', ...extraArgs], { stdio: params.quiet ? 'ignore' : 'inherit' });
  }

  /**
   * Build a cargo project
   *
   * @param params - Optional - Object of type {@link BuildParams}
   * @param options - Node child process options
   * @returns void
   */
  async build(params?: BuildParams, options?: PromisifySpawnOptions): Promise<void> {
    const extraArgs = [
      params?.release ? ['--release'] : [],
      params?.locked ? ['--locked'] : [],
      params?.target ? ['--target', params?.target] : [],
      params?.lib ? ['--lib'] : [],
      params?.quiet ? ['--quiet'] : [],
    ].flat();
    await this.run(['build', ...extraArgs], options);
  }

  /**
   * Build the project with a wasm target
   *
   * @param quiet - Optional - Hide output messages
   * @returns void
   */
  async wasm(quiet = false): Promise<void> {
    const extraArgs = [quiet ? ['--quiet'] : []].flat();

    await this.run(['wasm', ...extraArgs]);
  }

  /**
   * Returns the cargo file metadata in a JSON object
   *
   * @returns Object of type {@link Metadata}
   */
  async metadata(): Promise<Metadata> {
    const { stdout } = await this.run(['metadata', '--quiet', '--no-deps', '--format-version=1'], { stdio: 'pipe' });
    return JSON.parse(stdout?.toString() || '') as Metadata;
  }

  /**
   * Parses the project metadata.
   * If ran from a workspace, it will return the first package in the workspace.
   * If ran from a package folder, it will return the current package metadata.
   *
   * @returns Promise containing object of type {@link CargoProjectMetadata}
   */
  async projectMetadata(): Promise<CargoProjectMetadata> {
    const { packages = [], target_directory: targetDirectory, workspace_root: workspaceRoot } = await this.metadata();
    const currentManifestPath = await this.locateProject();

    const findPackageInPath = (searchPath: string): Package | undefined => packages
      .find(({ manifest_path: manifestPath }) => path.dirname(manifestPath) === searchPath);

    const firstPackageInWorkspace = (searchPath: string): Package | undefined => (workspaceRoot === searchPath ? _.head(packages) : undefined);

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
      optimizedFilePath: path.join(workspaceRoot, Cargo.OptimizedOutputDir, wasmFileName),
    };

    return { name, label, version, wasm, root, workspaceRoot };
  }

  /**
   * Generate the schema files of a project
   *
   * @param params - Optional - Object of type {@link SchemaParams}
   * @param options - Node child process options
   * @returns void
   */
  async schema(params?: SchemaParams, options?: PromisifySpawnOptions): Promise<void> {
    const { name: contractName } = await this.projectMetadata();

    const extraArgs = [['--package', contractName]].flat();

    await this.run(['schema', ...extraArgs], { stdio: params?.quiet ? 'ignore' : 'inherit', ...options });
  }

  /**
   * Generate the optimized wasm version of a contract
   *
   * @param params - Optional - {@link OptimizeParams} for the optimization
   * @returns - Promise containing the path where the optimized version was saved
   */
  async optimize(params: OptimizeParams = {}): Promise<string> {
    const { wasm, root, workspaceRoot } = await this.projectMetadata();

    const optimizer = new DockerOptimizer({});
    const contractRoot = params.all ? undefined : root;
    await optimizer.run(workspaceRoot, contractRoot, params.quiet);

    return params.all ? path.join(workspaceRoot, Cargo.OptimizedOutputDir) : wasm.optimizedFilePath;
  }

  /**
   * Runs the cargo shell command
   *
   * @param args - Array of arguments to be passed to the cargo command
   * @param options - Node child process options
   * @returns - Output of command, with a {@link ChildProcessPromise} that contains stdout, and stderr
   */
  private run(args: string[], options?: PromisifySpawnOptions): ChildProcessPromise {
    debug('cargo', ...args);
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
class CargoMetadataError extends ConsoleError {
  /**
   * @param workingDir - Optional - Path from where the project metadata was attempted to load
   */
  constructor(public workingDir?: string) {
    super(ErrorCodes.CARGO_METADATA_ERROR);
  }

  toConsoleString(): string {
    const pwdMessage = this.workingDir ? bold(` from ${this.workingDir}`) : '';
    return `${redBright('Failed to resolve project metadata')}${pwdMessage}`;
  }
}
