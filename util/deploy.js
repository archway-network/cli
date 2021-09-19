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

function makeOptimizedWasm(config = null) {
  if (!config || typeof config !== 'object') {
    console.error('Error processing config', config);
    return;
  } else {
    console.log('Building optimized wasm binary...\n');
  }
  // $ export pwd=YOUR_WASM_KEYCHAIN_PASSWORD
  // $ docker run --rm -v "$(pwd)":/code \
  // --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
  // --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  // cosmwasm/rust-optimizer:0.12.0
  
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
  ], { stdio: 'inherit' });
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