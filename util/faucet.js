// archway-cli/util/faucet.js

const { spawn } = require("child_process");
// const FileSystem = require('fs');
const HttpClient = require('axios');
const commands  = require('../constants/commands');

const TestnetData = {
  constantine: require('../data/testnet.constantine.json'),
  titus: require('../data/testnet.titus.json')
};
const chains = ['constantine', 'titus'];

// We assign the right daemon command in the main function and use it in the rest of the code
let archwaydCmd = null;
let selectedNetwork = null;

async function getListAccounts() {
  console.log('Printing list of active accounts...\n');

  const source = spawn(archwaydCmd.cmd, [...archwaydCmd.args, 'keys', 'list'], { stdio: 'inherit' });

  source.on('error', (err) => {
    console.log('Error listing keys', err);
  });
}

// async function verifyIsTestnet() {
//   let configPath = await ConfigTools.path();
//   FileSystem.access(configPath, FileSystem.F_OK, (err) => {
//     if (err) {
//       console.error('Error locating dApp config at path ' + configPath + '. Please run this command from the root folder of an Archway project.');
//       return null;
//     } else {
//       let config = require(configPath);
//       let chainId = config.network.chainId;
//       let isTestnet = false;
//       switch (chainId) {
//         case 'constantine-1': {
//           isTestnet = true;
//           break;
//         }
//         case 'titus-1': {
//           isTestnet = true;
//           break;
//         }
//       }
//       return isTestnet;
//     }
//   });
// }

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
      let statusMsg = 'Requested funds to ' + address + ' on network ' + chainId + ' using faucet ' + faucet;
      if (response.data.transfers) {
        if (response.data.transfers[0]) {
          if (response.data.transfers[0].status) {
            if (response.data.transfers[0].status == 'error') {
              statusMsg += ' \nPanic! REQUEST FAILED';
            } else {
              statusMsg += ' \nSuccess! REQUEST SENT';
            }
          }
        }
      }
      console.log(statusMsg);
    } else {
      console('Error requesting funds from faucet', {faucet: faucet, error: response});
    }
  }).catch((httpError) => {
    console.error('Error requesting funds from faucet', {faucet: faucet, error: httpError});
  });
}

function handleFaucetRequest() {
  let config;
  if (!selectedNetwork) {
    return console.log("Error selecting testnet network and chain ID", selectedNetwork);
  }
  switch (selectedNetwork) {
    case chains[0]: {
      config = TestnetData.constantine;
      break;
    }
    case chains[1]: {
      config = TestnetData.titus;
      break;
    }
    default: {
      config = TestnetData.constantine;
    }
  }

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Enter an address to receive Testnet funds (e.g. "archway1x35egm8883wzg2zwqkvcjp0j4g25p4hed4yjuv"; Or, hit <enter> to list accounts): ', account => {
    if (!account) {
      readline.close();
      getListAccounts();
    } else {
      readline.close();
      faucetRequestWorker(account, config);
    }
  });
}

const faucetRequest = (docker, testnet) => {
  archwaydCmd = docker ? commands.ArchwayDocker : commands.ArchwayBin;

  if (!testnet) {
    testnet = chains[0];
  }
  selectedNetwork = testnet;

  const isTestnet = true;
  if (!isTestnet) {
    console.error('Error: requesting faucet funds is only possible with a Testnet network configuration.');
    console.error('Try "archway network --help" for information about switching network configurations.');
    return;
  } else {
    handleFaucetRequest();
  }
};

module.exports = faucetRequest;