// archway-cli/util/test.js

const { spawn } = require("child_process");
const FileSystem = require('fs');

function tryTesting() {
  let configPath = process.cwd() + '/config.json';
  FileSystem.access(configPath, FileSystem.F_OK, (err) => {
    if (err) {
      console.error('Error locating dApp config at path ' + configPath + '. Please run this command from the root folder of an Archway project.');
      return;
    } else {
      console.log('Loading tests...\n');

      let config = require(configPath);
      let scripts = config.developer.scripts;
      let runScript = {};
      runScript.raw = scripts.test;
      runScript.arr = runScript.raw.split(' ');
      runScript.cmd = runScript.arr[0];
      runScript.params = runScript.arr.slice(1);

      const source = spawn(runScript.cmd, runScript.params, { stdio: 'inherit' });

      source.on('error', (err) => {
        console.log('Error running tests', err);
      });
    }
  });
};

const testRunner = () => {
  try {
    tryTesting();
  } catch(e) {
    console.error('Error calling build script', e);
  }
};

module.exports = testRunner;