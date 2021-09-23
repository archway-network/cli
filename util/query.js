// archway-cli/util/query.js

const { spawn } = require("child_process");
const FileSystem = require('fs');

function tryQuery(args) {
  if (typeof args !== 'object') {
    console.error('Error processing query args', args);
    return;
  } else if (!args.command) {
    console.error('Error processing query args', args);
    return;
  }


  let configPath = process.cwd() + '/config.json';
  FileSystem.access(configPath, FileSystem.F_OK, (err) => {
    if (err) {
      console.error('Error locating dApp config at path ' + configPath + '. Please run this command from the root folder of an Archway project.');
      return;
    } else {
      console.log('Attempting query...\n');

      let config = require(configPath);
      let scripts = config.developer.scripts;
      let runScript = {};
      runScript.raw = scripts.query;
      runScript.arr = runScript.raw.split(' ');
      runScript.cmd = runScript.arr[0];
      runScript.params = runScript.arr.slice(1);

      // Extend params to inlcude all subcommands and args
      
      // Lvl. 1 cmd
      runScript.params.push(args.command);
      
      // Lvl. 2 cmd
      if (args.subcommand) {
        runScript.params.push(args.subcommand);
      }

      // Address to query
      // XXX TODO: Allow override and selecting other deployments
      // For now defaults to most recent deployment
      let deployment = config.developer.deployments[0];
      let rpc = config.network.urls.rpc;
      runScript.params.push(deployment.address);

      // Query to make
      runScript.params.push(args.query);

      // Additional flags
      let flags = (args.flags) ? args.flags.split(' ') : [];
      flags.push('--node');
      flags.push(rpc);
      flags.push('--output');
      flags.push('json');

      const source = spawn(runScript.cmd, runScript.params, { stdio: 'inherit' });

      source.on('error', (err) => {
        console.log('Error running query', err);
      });
    }
  });
};

const queryRunner = (args) => {
  try {
    tryQuery(args)
  } catch(e) {
    console.error('Error running query', e);
  }
};

module.exports = queryRunner;