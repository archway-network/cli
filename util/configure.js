// archway-cli/util/configure.js

const { spawn } = require("child_process");
const FileSystem = require('fs');
const StringUtility = require('util');

// const readline = require('readline').createInterface({
//   input: process.stdin,
//   output: process.stdout
// });

function printDevConfig() {
  console.log('Printing environment settings...');

  let configPath = process.cwd() + '/config.json';
  FileSystem.access(configPath, FileSystem.F_OK, (err) => {
    if (err) {
      console.error('Error locating dApp config at path ' + configPath + '. Please run this command from the root folder of valid Archway project.');
      return;
    } else {
      let config = require(configPath);
      console.log(StringUtility.inspect(config, false, null, true));
    }
  })
}

const configureEnv = (modify = false, key = null) => {
  if (modify) {
    console.log('Modifying key ' + key + '...');
    console.log('XXX TODO: modify config');
  } else {
    printDevConfig();
  }
};

module.exports = configureEnv;