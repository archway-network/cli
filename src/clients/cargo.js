const debug = require('debug')('cargo');
const _ = require('lodash');
const path = require('path');
const { spawn } = require('promisify-child-process');

class Cargo {
  static WasmTarget = 'wasm32-unknown-unknown';

  #cwd;

  constructor({ cwd } = {}) {
    this.#cwd = cwd || process.cwd();
  }

  /**
   * @private
   */
  async locateProject() {
    const { stdout } = await this.#run(['locate-project', '--message-format', 'plain'], { stdio: 'pipe' });
    return path.dirname(stdout || '');
  }

  async generate(name, repository, branch, template) {
    await this.#run([
      'generate',
      '--name', name,
      '--git', repository,
      '--branch', branch,
      template
    ]);
  }

  async build({ release = false, locked = false, target } = {}, options) {
    const extraArgs = _.flatten([
      release ? ['--release'] : [],
      locked ? ['--locked'] : [],
      target ? ['--target', target] : [],
    ]);
    await this.#run(['build', ...extraArgs], options);
  }

  async wasm() {
    await this.build(
      { release: true, locked: true, target: Cargo.WasmTarget },
      { env: { ...process.env, RUSTFLAGS: '-C link-arg=-s' } }
    );
  }

  /**
   * @private
   */
  async metadata() {
    const { stdout } = await this.#run([
      'metadata',
      '--quiet',
      '--no-deps',
      '--format-version=1'
    ], { stdio: 'pipe' });
    return JSON.parse(stdout);
  }

  /**
   * Parses the project metadata.
   * If ran from a workspace, it will return the first package in the workspace.
   * If ran from a package folder, it will return the current package metadata.
   *
   * @returns {Promise<{ name: string, version: string, wasm: { fileName: string, filePath: string, optimizedFilePath: string }, workspaceRoot: string, isWorkspace: boolean }>}
   */
  async projectMetadata() {
    const { packages = [], target_directory: targetDirectory, workspace_root: workspaceRoot } = await this.metadata();
    const currentManifestPath = await this.locateProject();

    const findPackageInPath = searchPath => packages
      .find(({ manifest_path: manifestPath }) => path.dirname(manifestPath) === searchPath);

    const firstPackageInWorkspace = searchPath => workspaceRoot === searchPath ? _.head(packages) : null;

    const { name, version, manifest_path: manifestPath } =
      findPackageInPath(currentManifestPath) || firstPackageInWorkspace(currentManifestPath) || {};

    if (_.isEmpty(name) || _.isEmpty(version)) {
      throw new Error('Failed to resolve project metadata');
    }

    const id = `${name} ${version}`;
    const isWorkspace = path.dirname(manifestPath) !== workspaceRoot;
    const wasmFileName = `${name.replace(/-/g, '_')}.wasm`;
    const wasm = {
      fileName: wasmFileName,
      filePath: path.join(targetDirectory, Cargo.WasmTarget, 'release', wasmFileName),
      optimizedFilePath: path.join(workspaceRoot, 'artifacts', wasmFileName)
    };

    return { id, name, version, wasm, workspaceRoot, isWorkspace };
  }

  /**
   * @deprecated since v1.2.0
   */
  runScript(name, options = {}) {
    return this.#run(['run-script', name], options);
  }

  #run(args, options = { stdio: 'inherit' }) {
    debug('cargo', ...args);
    return spawn('cargo', args, {
      ...options,
      cwd: this.#cwd,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 // (Large enough for verbose error debugging)
    });
  }
}

module.exports = Cargo;
