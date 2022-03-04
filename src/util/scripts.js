const path = require('path');
const { spawn } = require('promisify-child-process');
const Config = require('./config');

class ScriptRunner {
  constructor({ config, pathPrefix } = {}) {
    this.config = config;
    this.pathPrefix = pathPrefix;
  }

  async run(scriptName) {
    const [command, ...args] = await this.#getCommand(scriptName);
    if (!command) {
      throw new Error(`No command found for script ${scriptName}`);
    }

    const rootPath = path.dirname(await Config.path(this.pathPrefix));
    return await spawn(command, args, { stdio: 'inherit', cwd: rootPath });
  }

  async #getCommand(scriptName) {
    const config = this.config || await Config.read(this.pathPrefix);
    const {
      developer: {
        scripts: {
          [scriptName]: commandLine = ''
        } = {}
      } = {}
    } = config;

    return commandLine.split(' ');
  }
}

module.exports = ScriptRunner
