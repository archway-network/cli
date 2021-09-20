// archway-cli/util/deploy.js

const { spawn } = require("child_process");
const FileSystem = require('fs');
const Path = require('path');

function tryWasm() {
  let configPath = process.cwd() + '/config.json';
  FileSystem.access(configPath, FileSystem.F_OK, (err) => {
    if (err) {
      console.error('Error locating dApp config at path ' + configPath + '. Please run this command from the root folder of an Archway project.');
      return;
    } else {
      console.log('Building wasm executable...\n');

      let config = require(configPath);
      let scripts = config.developer.scripts;
      let runScript = {};
      runScript.raw = scripts.wasm;
      runScript.arr = runScript.raw.split(' ');
      runScript.cmd = runScript.arr[0];
      runScript.params = runScript.arr.slice(1);

      const source = spawn(runScript.cmd, runScript.params, { stdio: 'inherit' });

      source.on('error', (err) => {
        console.log('Error building wasm executable', err);
      });
    }
  });
};

function dryRunner() {
  try {
    tryWasm();
  } catch(e) {
    console.error('Error creating wasm executable', e);
  }
};

function uploadArchivedExecutable(config = null) {//here
  console.log('Ok?', config);
  if (!config || typeof config !== 'object') {
    console.error('Error processing config', config);
    return;
  }

  let chainId = config.network.chainId;
  console.log('\nUploading optimized executable to ' + chainId + '...\n');

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Send tx from which wallet in your keychain? (e.g. "main" or crtl+c to quit): ', walletLabel => {
    if (!walletLabel || walletLabel == '') {
      console.error('Error reading wallet label', walletLabel);
      readline.close();
      return;
    }
    // # Store code
    // $ RES=$(wasmd tx wasm store artifacts/YOUR_DOCKER_WASM_OUTPUT_FILE.wasm --from YOUR_WALLET_NAME --chain-id $CHAIN_ID $TXFLAG -y)
    let runScript = {};
    let wasmPath = 'artifacts/' + config.title + '.wasm';
    let rpc = config.network.urls.rpc;
    let node = rpc.url + ':' + rpc.port;
    let gasPrices = config.network.gas.prices;
    let gas = config.network.gas.mode;
    let gasAdjustment = config.network.gas.adjustment;

    runScript.cmd = 'wasmd';
    runScript.params = [
      'tx',
      'wasm',
      'store',
      wasmPath,
      '--from',
      walletLabel,
      '--chain-id',
      chainId,
      '--node',
      node,
      '--gas-prices',
      gasPrices,
      '--gas',
      gas,
      '--gas-adjustment',
      gasAdjustment
    ];
    
    const source = spawn(runScript.cmd, runScript.params, { stdio: 'inherit' });
    // const source = spawn(runScript.cmd, runScript.params);

    // # Get code ID
    // $ CODE_ID=$(echo $RES | jq -r '.logs[0].events[-1].attributes[0].value')
    let codeId;
    source.stdout.on('data', (data) => {
      let outputMsg = Buffer.from(data).toString().trim();
      console.log('?', outputMsg);
      if (outputMsg.indexOf('txhash') > -1) {
        try {
          let json = JSON.parse(outputMsg);
          let events = json.logs[0].events;
          codeId = events[0].attributes[-1].value;
          // # Query
          // $ wasmd query wasm list-contract-by-code $CODE_ID $NODE --output json
        } catch(e) {
          console.error('Error uploading contract', e);
          return;
        }
      }
    });

    source.on('close', () => {
      if (codeId) {
        verifyWasmUpload(codeId, node, wasmPath, chainId);
      }
    });
  });
};

function verifyWasmUpload(codeId = null, node = null, path = null, chainId = null) {
  if (!codeId) {
    console.error('Error getting Code ID of wasm upload', codeId);
    return;
  } else if (!node) {
    console.erroer('Error getting node setting', node);
  } else if (!path) {
    console.error('Error getting path to wasm artifacts', path);
  } else if (!chainId) {
    console.error('Error getting network chain id', chainId);
  } else {
    console.log('\nDownloading build artifact from ' + chainId + ' and saving as "download.wasm"...\n');
  }
  // # Verify your uploaded code matches your local build
  // $ wasmd query wasm code $CODE_ID $NODE download.wasm
  let runScript = {};

  runScript.cmd = 'wasmd';
  runScript.params = [
    'query',
    'wasm',
    'code',
    codeId,
    '--node',
    node,
    'download.wasm'
  ];

  const source = spawn(runScript.cmd, runScript.params, { stdio: 'inherit' });

  source.on('close', () => {
    let downloadPath = process.cwd() + '/download.wasm';
    FileSystem.access(downloadPath, FileSystem.F_OK, (err) => {
      if (err) {
        console.error('Error locating downloaded wasm file');
        return;
      } else {
        // $ diff artifacts/YOUR_DOCKER_WASM_OUTPUT_FILE.wasm download.wasm
        let diffMsgs = 0;
        const verify = spawn('diff', [path, downloadPath]);
        verify.stdout.on('data', (data) => {
          let outputMsg = Buffer.from(data).toString().trim();
          if (outputMsg.length) {
            console.log(outputMsg)
            ++diffMsgs;
          }
        });
        verify.on('close', () => {
          if (diffMsgs === 0) {
            console.log('Integrity check Ok!\n');
            deployInstance(codeId);
          }
        });
      }
    });
  });
};

function deployInstance(codeId = null) {
  let args; // XXX TODO: Allow use args override
  if (!codeId) {
    console.error('Error reading Code ID', codeId);
    return;
  }
  let configPath = process.cwd() + '/config.json';
  FileSystem.access(configPath, FileSystem.F_OK, (err) => {
    if (err) {
      console.error('Error locating dApp config at path ' + configPath + '. Please run this command from the root folder of an Archway project.');
      return;
    } else {
      let config = require(configPath);
      let title = config.title;
      let chainId = config.network.chainId;
      let rpc = config.network.urls.rpc;
      let node = rpc.url + ':' + rpc.port;
      let gasPrices = config.network.gas.prices;
      let gas = config.network.gas.mode;
      let gasAdjustment = config.network.gas.adjustment;
      
      console.log('Deploying an instance of ' + title + ' to ' + chainId + '...\n');

      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
    
      readline.question('Send tx from which wallet in your keychain? (e.g. "main" or crtl+c to quit): ', walletLabel => {
        if (!walletLabel || walletLabel == '') {
          console.error('Error reading wallet label', walletLabel);
          readline.close();
          return;
        }
        let questionTwo = `Label this deployment? (e.g. "my deployment label", default: ${config.title} ${config.version}): `;
        let questionThree = `JSON encoded constructor arguments (e.g. "{"count": 1}", default: "{}")`;
        readline.question(questionTwo, deploymentLabel => {
          if (!deploymentLabel) {
            deploymentLabel = config.title + ' ' + config.version;
          } else {
            if (typeof deploymentLabel !== 'string') {
              deploymentLabel = config.title + ' ' + config.version;
            } else if (deploymentLabel.length < 1) {
              deploymentLabel = config.title + ' ' + config.version;
            }
          }

          readline.question(questionThree, constructors => {
            if (!constructors) {
              constructors = '{}';
            } else if (typeof constructors !== 'string') {
              constructors = '{}';
            } else {
              try {
                JSON.parse(constructors);
              } catch (e) {
                constructors = '{}';
              }
            }

            // $ INIT=$(jq -n --arg YOUR_WALLET_NAME $(wasmd keys show -a YOUR_WALLET_NAME) '{count:1}')
            // $ wasmd tx wasm instantiate $CODE_ID "$INIT" --from YOUR_WALLET_NAME --label "your contract label" $TXFLAG -y
            let runScript = {};
            runScript.cmd = 'wasmd';
            runScript.params = [
              'tx',
              'wasm',
              'instantiate',
              codeId,
              constructors,
              '--from',
              walletLabel,
              '--label',
              deploymentLabel,
              '--chain-id',
              chainId,
              '--node',
              node,
              '--gas-prices',
              gasPrices,
              '--gas',
              gas,
              '--gas-adjustment',
              gasAdjustment,
              '-y'
            ];

            const source = spawn(runScript.cmd, runScript.params, { stdio: 'inherit' });

            source.on('error', (err) => {
              console.log('Error deploying instance of contract', err);
            });
          });
        });
      });
    }
  });
}

function makeOptimizedWasm(config = null) {
  if (!config || typeof config !== 'object') {
    console.error('Error processing config', config);
    return;
  } else {
    console.log('Building optimized wasm binary...\n');
  }
  
  let target = config.network.optimizers.docker.target;
  let targetSrc = Path.basename(process.cwd()) + '_cache';
  let container = config.network.optimizers.docker.image;
  const source = spawn('docker', [
    'run',
    '--rm',
    '-v',
    process.cwd() + ':/code',
    // Local project mount
    '--mount',
    'type=volume,source=' + targetSrc + ',target=/code/target',
    // Registry mount
    '--mount',
    'type=volume,source=registry_cache,target=' + target,
    container
  ]);

  source.stdout.on('data', (data) => {
    let outputMsg = Buffer.from(data).toString();
    console.log(outputMsg.trim());
    if (outputMsg.indexOf('done') > -1) {
      console.log('Ok!');
      uploadArchivedExecutable(config);
    }
  });
}

function handleDeployment() {
  let configPath = process.cwd() + '/config.json';
  FileSystem.access(configPath, FileSystem.F_OK, async (err) => {
    if (err) {
      console.error('Error locating dApp config at path ' + configPath + '. Please run this command from the root folder of an Archway project.');
      return;
    } else {
      let config = require(configPath);
      // Step 1: Optimized Wasm binary
      await makeOptimizedWasm(config);
      // Step 2: Upload archived executable to network
      // Step 3: Create an instance of uploaded contract
      // Step 4: Verify instance source code matches local build
    }
  });
}

const deployer = (dryrun = null) => {
  if (dryrun) {
    dryRunner();
  } else {
    handleDeployment();
  }
};

module.exports = deployer;