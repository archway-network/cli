// archway-cli/util/test.js

const { spawn } = require("child_process");
const FileSystem = require('fs');
const constants  = require('./constants');

function tryScript(key) {
  let configPath = process.cwd() + '/config.json';
  FileSystem.access(configPath, FileSystem.F_OK, (err) => {
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
      // let's have an exception here
      if( runScript.cmd == 'archwayd'){
          runScript.Cmd = constants.Archwayd.cmd;
          runScript.params = [...constants.Archwayd.args, ...runScript.params];
      }

      console.log( "\n\t\tCMD: ", runScript);

      const source = spawn(runScript.cmd, runScript.params, { stdio: 'inherit' });

      source.on('error', (err) => {
        console.log('Error executing script', err);
      });
    }
  });
};

const scriptRunner = (key) => {
  if (typeof key !== 'string') {
    console.error('Error executing script', key);
    return;
  } else {
    try {
      tryScript(key);
    } catch(e) {
      console.error('Error executing script', [key, e]);
    }
  }
};

module.exports = scriptRunner;