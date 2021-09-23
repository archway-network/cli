// archway-cli/util/tx.js

//wasmd tx wasm execute $CONTRACT $INCREMENT --from YOUR_WALLET_NAME $TXFLAG -y

const { spawn } = require("child_process");
const FileSystem = require('fs');

function tryExecuteTx(args) {
  if (typeof args !== 'object') {
    console.error('Error processing constructor args', args);
    return;
  }

  let configPath = process.cwd() + '/config.json';
  FileSystem.access(configPath, FileSystem.F_OK, (err) => {
    if (err) {
      console.error('Error locating dApp config at path ' + configPath + '. Please run this command from the root folder of an Archway project.');
      return;
    } else {
      console.log('Attempting transaction...\n');

      let config = require(configPath);
      let scripts = config.developer.scripts;
      let runScript = {};
      runScript.raw = scripts.tx;
      runScript.arr = runScript.raw.split(' ');
      runScript.cmd = runScript.arr[0];
      runScript.params = runScript.arr.slice(1);

      if (!args.tx) {
        args.tx = '{}';
      }

      let deployments = config.developer.deployments;
      let flags = (args.flags) ? args.flags.split(' ') : [];

      if (!args.contract) {
        for (let i = 0; i < deployments.length; i++) {
          if (deployments[i].address) {
            let contract = deployments[i].address;
            runScript.params.push(contract);
            doExecute(runScript, flags, args, config);
            break;
          }
        }
      } else {
        let contract = args.contract;
        runScript.params.push(contract);
        doExecute(runScript, flags, args, config);
      }
      
    }
  });
};

function doExecute(runScript, flags, args, config) {

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Send tx from which wallet in your keychain? (e.g. "main" or crtl+c to quit): ', walletLabel => {
    if (!walletLabel || walletLabel == '') {
      console.error('Error reading wallet label', walletLabel);
      readline.close();
      return;
    } else {
      try {     
        // Tx constructor args
        runScript.params.push(args.tx);
    
        // Additional flags
        let rpc = config.network.urls.rpc;
        let node = rpc.url + ':' + rpc.port;
        let gasPrices = config.network.gas.prices;
        let gas = config.network.gas.mode;
        let gasAdjustment = config.network.gas.adjustment;
        let chainId = config.network.chainId;
        flags.push('--from');
        flags.push(walletLabel);
        flags.push('--chain-id');
        flags.push(chainId);
        flags.push('--node');
        flags.push(node);
        flags.push('--gas-prices');
        flags.push(gasPrices);
        flags.push('--gas');
        flags.push(gas);
        flags.push('--gas-adjustment');
        flags.push(gasAdjustment);


        params = runScript.params.concat(flags);
    
        readline.close();
        const source = spawn(runScript.cmd, params, { stdio: 'inherit' });
    
        source.on('error', (err) => {
          console.log('Error executing transaction', err);
        });
    
        source.on('close', () => {
          console.log('\nOk!');
        });
      } catch(e) {
        console.log('Error executing transaction', e);
      }
    }
  });
}

const txRunner = (args) => {
  try {
    tryExecuteTx(args)
  } catch(e) {
    console.error('Error executing transaction', e);
  }
};

module.exports = txRunner;