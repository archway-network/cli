const path = require('path');
const { spawn } = require('promisify-child-process');

class Cargo {
  #cwd

  constructor({ cwd } = {}) {
    this.#cwd = cwd || process.cwd();
  }

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

  async build() {
    await this.#run(['build']);
  }

  async metadata() {
    const { stdout } = await this.#run([
      'metadata',
      '--quiet',
      '--no-deps',
      '--format-version=1'
    ], { stdio: 'pipe', maxBuffer: 1024 * 1024 });
    return JSON.parse(stdout);
  }

  async projectMetadata() {
    const { packages: [{ name, version, metadata },] = [] } = await this.metadata();
    return { id: `${name} ${version}`, name, version, metadata };
  }

  runScript(name, options = {}) {
    return this.#run(['run-script', name], options);
  }

  #run(args, options = { stdio: 'inherit' }) {
    return spawn('cargo', args, { ...options, encoding: 'utf8', cwd: this.#cwd });
  }
}

module.exports = Cargo;
