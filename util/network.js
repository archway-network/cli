// archway-cli/util/network.js

const FileSystem = require('fs');

function migrateNetworks(networkInt = null) {
  console.log('Network migration is coming soon');
  console.log('XXX TODO: This')
};

function printNetConfig() {
  console.log('Printing network settings...');

  let configPath = process.cwd() + '/config.json';
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
          currentNetwork += 'Titus Testnet'
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
            envI = parseInt(environment);
            if (envI !== 1 && envI !== 2 && envI !== 3) {
              console.log('Error: unrecognized environment', environment);
              readline.close();
            } else {
              readline.close();
              migrateNetworks(envI);
            }
          });
        }
      });
    }
  });
}

const showOrMigrateNetwork = () => {
  printNetConfig();
}

module.exports = showOrMigrateNetwork;