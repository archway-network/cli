const chalk = require('chalk');
const path = require('path');
const { mkdir } = require('fs/promises');
const { spawn } = require('promisify-child-process');
const ora = require('ora');
const Cargo = require('../clients/cargo');

async function build(cargo) {
  console.info(`Building the project...`);
  await cargo.build();
}

async function optimizeWasm(cargo) {
  console.info('Building wasm binary...');

  await cargo.wasm();

  const { wasm: { filePath, optimizedFilePath } } = await cargo.projectMetadata();

  await mkdir(path.dirname(optimizedFilePath), { recursive: true });

  const wasmOptArgs = ['-Os', filePath, '-o', optimizedFilePath];
  const wasmOpt = spawn('wasm-opt', wasmOptArgs, { encoding: 'utf8', maxBuffer: 1024 * 1024 });
  ora.promise(wasmOpt, 'Optimizing wasm file...');
  await wasmOpt;

  console.info(chalk`{green Optimized wasm binary saved to {cyan ${optimizedFilePath}}}\n`);
}

async function main({ optimize = false } = {}) {
  try {
    const cargo = new Cargo();
    if (optimize) {
      await optimizeWasm(cargo);
    } else {
      await build(cargo);
    }
  } catch (e) {
    console.error(chalk`{red.bold Build failed}`);
    throw e;
  }
}

module.exports = main;
