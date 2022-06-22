// archway-cli/util/test.js

const { spawn } = require("child_process");
const FileSystem = require('fs');
const commands = require('../constants/commands');
const ConfigTools = require('../constants/config');

// We assign the right daemon command in the main function and use it in the rest of the code
let archwaydCmd = null;

async function tryScript(key) {
  let configPath = ConfigTools.path();
  FileSystem.access(configPath, FileSystem.F_OK, err => {
    if (err) {
      console.error('Error locating dApp config at path ' + configPath + '. Please run this command from the root folder of an Archway project.');
      return;
    } else {
      console.log('Running script ' + key + '...\n');

      let config = require(configPath);
      let scripts = config.developer.scripts;
      let runScript = {};
      runScript.raw = scripts[key];
      runScript.arr = runScript.raw.split(' ');
      runScript.cmd = runScript.arr[0];
      runScript.params = runScript.arr.slice(1);

      // in order to have only one place for the archwayd docker command (i.e. in constants),
      // let's have an exception for the archway daemon here
      if (runScript.cmd === 'archwayd') {
        runScript.Cmd = archwaydCmd.cmd;
        runScript.params = [...archwaydCmd.args, ...runScript.params];
      }

      // console.log( "\n\t\tCMD: ", runScript);

      const source = spawn(runScript.cmd, runScript.params, { stdio: 'inherit' });

      source.on('error', err => {
        console.log('Error executing script', err);
      });
    }
  });
}

const scriptRunner = (docker, key) => {
  archwaydCmd = docker ? commands.ArchwayDocker : commands.ArchwayBin;
  if (typeof key !== 'string') {
    console.error('Error executing script', key);
    return;
  } else {
    try {
      tryScript(key);
    } catch (e) {
      console.error('Error executing script', [key, e]);
    }
  }
};

module.exports = scriptRunner;
