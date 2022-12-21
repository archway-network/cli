const path = require('path');
const chalk = require('chalk');
const Cargo = require('../clients/cargo');
const WasmOptimizer = require('../clients/wasm_optimizer');

/**
 * Builds the project wasm file in release mode.
 *
 * @param {Cargo} cargo
 */
async function build(cargo) {
  console.info('Building the project...');
  await cargo.build();

  const { wasm: { filePath } } = await cargo.projectMetadata();
  const relativePath = path.relative(process.cwd(), filePath);
  console.info(chalk`\n{green Wasm binary saved to {cyan ${relativePath}}}\n`);
}

/**
 * Builds the project wasm file in release mode and optimizes it.
 *
 * @param {Cargo} cargo
 */
async function optimizeWasm(cargo) {
  console.info('Building optimized wasm file...');

  const { wasm: { optimizedFilePath }, workspaceRoot, isWorkspace } = await cargo.projectMetadata();
  const optimizer = new WasmOptimizer();
  const { error, statusCode } = await optimizer.run(workspaceRoot, isWorkspace);
  if (statusCode !== 0) {
    throw new Error(error);
  }

  const relativePath = path.relative(process.cwd(), optimizedFilePath);
  console.info(chalk`\n{green Optimized wasm binary saved to {cyan ${relativePath}}}\n`);
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
    console.error(chalk`{red ${e.message}}`);
    throw e;
  }
}

module.exports = main;
