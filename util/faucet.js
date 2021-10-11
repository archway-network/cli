// archway-cli/util/faucet.js

const { spawn } = require("child_process");
const FileSystem = require('fs');
const HttpClient = require('axios');

async function getListAccounts() {
  console.log('Printing list of active accounts...\n');

  const source = spawn('archwayd', ['keys', 'list'], { stdio: 'inherit' });

  source.on('error', (err) => {
    console.log('Error listing keys', err);
  });
};

function verifyIsTestnet() {
  let configPath = process.cwd() + '/config.json';
  FileSystem.access(configPath, FileSystem.F_OK, (err) => {
    if (err) {
      console.error('Error locating dApp config at path ' + configPath + '. Please run this command from the root folder of an Archway project.');
      return null;
    } else {
      let config = require(configPath);
      let chainId = config.network.chainId;
      let isTestnet = false;
      switch (chainId) {
        case 'pebblenet-1': {
          isTestnet = true;
          break;
        }
      }
      return isTestnet;
    }
  });
};

async function faucetRequestWorker(address = null, config = null) {
  if (!address) {
    console.error('Error with address name', address);
    return;
  } else if (typeof config !== 'object') {
    console.log('Error reading from config', config);
    return;
  }

  console.log('Requesting faucet funds to account ' + address + '...\n');

  let feeDenom = config.network.fees.feeDenom;
  let chainId = config.network.chainId;
  let faucet = config.network.urls.faucets[0]; // XXX TODO: Add option to use alternate faucets from array
  let request = {
    "denom": feeDenom,
    "address": address
  };

  HttpClient.post(faucet, request).then((response) => {
    if (!response || typeof response !== 'object') {
      console('Error requesting funds from faucet', {faucet: faucet, error: response});
    } else if (!response.status) {
      console('Error requesting funds from faucet', {faucet: faucet, error: response});
    }

    if (response.status == 200) {
      if (response.data) {
        console.log(response.data);
      }
      let statusMsg = 'Successfully requested funds to ' + address + ' on network ' + chainId + ' using faucet ' + faucet;
      console.log(statusMsg);
    } else {
      console('Error requesting funds from faucet', {faucet: faucet, error: response});
    }
  }).catch((httpError) => {
    console.error('Error requesting funds from faucet', {faucet: faucet, error: httpError});
  });
}

function handleFaucetRequest() {
  let configPath = process.cwd() + '/config.json';
  FileSystem.access(configPath, FileSystem.F_OK, (err) => {
    if (err) {
      console.error('Error locating dApp config at path ' + configPath + '. Please run this command from the root folder of an Archway project.');
      return null;
    } else {
      let config = require(configPath);

      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
    
      readline.question('Enter an address to receive Testnet funds (e.g. "wasm1x35egm8883wzg2zwqkvcjp0j4g25p4hed4yjuv"; Or, hit <enter> to list accounts): ', account => {
        if (!account) {
          readline.close();
          getListAccounts();
        } else {
          readline.close();
          faucetRequestWorker(account, config);
        }
      });
    }
  });
}

const faucetRequest = () => {
  const isTestnet = verifyIsTestnet();
  if (isTestnet === null) {
    return;
  } else if (isTestnet === false) {
    console.error('Error: requesting faucet funds is only possible with a Testnet network configuration.');
    console.error('Try "archway network --help" for information about switching network configurations.');
    return;
  } else {
    handleFaucetRequest();
  }
}

module.exports = faucetRequest;