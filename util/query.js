// archway-cli/util/query.js

const { spawn } = require("child_process");
const commands = require('../constants/commands');
const FileSystem = require('fs');
const ConfigTools = require('../constants/config');

async function tryQuery(docker, args) {
  if (typeof args !== 'object') {
    console.error('Error processing query args', args);
    return;
  } else if (!args.command) {
    console.error('Error processing query args', args);
    return;
  }

  let configPath = ConfigTools.path();
  FileSystem.access(configPath, FileSystem.F_OK, (err) => {
    if (err) {
      console.error('Error locating dApp config at path ' + configPath + '. Please run this command from the root folder of an Archway project.');
      return;
    } else {
      console.log('Attempting query...\n');

      let config = require(configPath);
      let scripts = config.developer.scripts;
      let runScript = {};
      let dockerArchwayD, archwaydCmd;
      runScript.raw = scripts.query;
      if (docker) {
        dockerArchwayD = commands.ArchwayDocker;
        archwaydCmd = dockerArchwayD.cmd + ' ' + dockerArchwayD.args.join(" ");
        runScript.raw = runScript.raw.replace('archwayd', archwaydCmd);
      }
      runScript.arr = runScript.raw.split(' ');
      runScript.cmd = runScript.arr[0];
      runScript.params = runScript.arr.slice(1);

      // Extend params to include subcommands and args

      // Lvl. 1 cmd
      runScript.params.push(args.command);

      // Lvl. 2 cmd
      if (args.subcommand) {
        runScript.params.push(args.subcommand);
      }

      // Address to query
      // XXX TODO: Allow override and selecting other deployments
      // For now defaults to most recent deployment
      let deployments = config.developer.deployments;
      for (let i = 0; i < deployments.length; i++) {
        if (deployments[i].address) {
          let contract = deployments[i].address;
          runScript.params.push(contract);
          // Query to make
          runScript.params.push(args.query);

          // Additional flags
          let rpc = config.network.urls.rpc;
          let node = rpc.url + ':' + rpc.port;
          let flags = (args.flags) ? args.flags.split(' ') : [];
          flags.push('--node');
          flags.push(node);
          flags.push('--output');
          flags.push('json');

          const source = spawn(runScript.cmd, runScript.params.concat(flags), { stdio: 'inherit' });

          source.on('error', (err) => {
            console.log('Error running query', err);
          });

          source.on('close', () => {
            console.log('\nOk!');
          })
          break;
        }
      }
    }
  });
}

const queryRunner = (docker, args) => {
  try {
    tryQuery(docker, args)
  } catch (e) {
    console.error('Error running query', e);
  }
};

module.exports = queryRunner;
