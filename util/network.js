// archway-cli/util/network.js

const FileSystem = require('fs');
const util = require('util');
const { createInterface } = require('readline');
const ConfigTools = require('../constants/config');

const Testnet = {
  constantine: require('../data/testnet.constantine.json'),
  titus: require('../data/testnet.titus.json')
};

async function ask(readline, query, defaultValue = null) {
  const question = util.promisify(readline.question).bind(readline);
  return await question(`${query} (default: ${defaultValue}): `) || defaultValue;
}

async function askNumber(readline, query, defaultValue = null) {
  const answer = await ask(readline, query, defaultValue);
  return parseInt(answer);
}

async function migrateNetworks(networkInt = 1, config) {
  if (typeof config !== 'object') {
    console.log('Error reading config file', config);
    return;
  }
  let network = { current: config.network, new: null };
  switch (networkInt) {
    // Testnet
    case 1: {
      let selectedTestnet = 1; // (default Constantine)
      // Ask: Select a Testnet
      const readline = createInterface({
        input: process.stdin,
        output: process.stdout
      });
      do {
        console.log('\n1. Constantine [stable]\n2. Titus [nightly]\n');
        selectedTestnet = await askNumber(readline, 'Select a testnet to use [1-2]', 1);
      } while (!(selectedTestnet >= 1 && selectedTestnet <= 2))
      readline.close();
      // Update config
      if (selectedTestnet == 1) {
        // Constantine
        network.new = Testnet.constantine.network;
      } else if (selectedTestnet == 2) {
        // Titus
        network.new = Testnet.titus.network;
      } else {
        // Nothing
        network.new = false;
        return;
      }
      // Do update config
      if (network.new.chainId !== network.current.chainId) {
        // XXX DEBUG:
        // console.log({
        //   old: network.current,
        //   new: network.new
        // });
        console.log('Migrating from ' + network.current.chainId + ' to ' + network.new.chainId + '...');
        config.network = network.new;
        doCreateConfigFile(config);
      } else {
        console.log('Nothing to update.\nOk!\n');
      }
      return;
    }
    default: {
      console.log('Error migrating networks; unsupported network value', networkInt);
      return;
    }
  }
}

// XXX TODO: Make this a common utility module
function doCreateConfigFile(config = null) {
  if (!config) {
    console.log('Error creating config file', config);
  } else if (typeof config !== 'object') {
    console.log('Error creating config file', config);
  } else if (!config.title || !config.version || !config.network || !config.path || !config.type) {
    console.log('Error creating config file', config);
  }

  // XXX TODO: Remove path dependency in config
  // and use git to get top-level folder
  let path = config.path + '/config.json';
  let json = JSON.stringify(config, null, 2);

  FileSystem.writeFile(path, json, (err) => {
    if (err)
      console.error('\n\rError writing config to file system', [config, err]);
    else {
      console.log('\n\rSuccessfully updated config file: ' + path + '\n\r');
    }
  });
}

async function printNetConfig() {
  console.log('Printing network settings...');

  let configPath = process.cwd() + '/config.json';
  
  //XXX: here
  let test = await ConfigTools.path();
  console.log('ConfigTools.path', test);
  let test2 = await ConfigTools.config();
  console.log('ConfigTools.config', test2);
  
  FileSystem.access(configPath, FileSystem.F_OK, (err) => {
    if (err) {
      console.error('Error locating dApp config at path ' + configPath + '. Please run this command from the root folder of an Archway project.');
      return;
    } else {
      let config = require(configPath);
      let chainId = config.network.chainId,
          rpc = config.network.urls.rpc.url + ':' + config.network.urls.rpc.port,
          faucet = config.network.urls.faucets[0],
          networks = ['1. Testnet', '2. Localhost', '3. Mainnet'],
          currentNetwork;

      switch (chainId) {
        case 'constantine-1': {
          networks[0] += '*';
          currentNetwork = 'Constantine Testnet'
          break;
        }
        case 'titus-1': {
          networks[0] += '*';
          currentNetwork = 'Titus Testnet'
          break;
        }
        case 'localhost': {
          networks[1] += '*';
          currentNetwork = networks[1].replace('2. ','').replace('*','');
          break;
        }
        case 'mainnet': {
          networks[2] += '*';
          currentNetwork = networks[2].replace('3. ','').replace('*','');
        }
      }

      let networksMsg = networks.join('\n');
      console.log('\n');
      console.log(networksMsg);
      console.log('\n');
      console.log('Using:  ' + currentNetwork);
      console.log('RPC:    ' + rpc);
      console.log('Faucet: ' + faucet);
      console.log('\n');

      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      readline.question('Migrate to another network? (Y/N default: N): ', doMigration => {
        if (doMigration.toLowerCase() !== 'y' && doMigration.toLowerCase() !== 'yes') {
          console.log('Ok!');
          readline.close();
          return;
        } else {
          console.log('\n1. Testnet\n2. Localhost\n3. Mainnet\n');
          readline.question('Select environment type (1-3 default: 1): ', environment => {
            let envI = parseInt(environment);
            if (envI !== 1 && envI !== 2 && envI !== 3) {
              envI = 1;
              readline.close();
            } else {
              readline.close();
            }
            migrateNetworks(envI, config);
          });
        }
      });
    }
  });
}

const showOrMigrateNetwork = () => {
  printNetConfig();
};

module.exports = showOrMigrateNetwork;