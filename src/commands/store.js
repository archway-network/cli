const _ = require('lodash');
const chalk = require('chalk');
const { prompts, PromptCancelledError } = require('../util/prompts');
const crypto = require('crypto');
const path = require('path');
const { readFile, copyFile, mkdir } = require('fs/promises');
const { pathExists } = require('../util/fs');
const { Config } = require('../util/config');
const retry = require('../util/retry');
const Cargo = require('../clients/cargo');

// TODO: move to a shared lib function
async function parseDeploymentOptions(cargo, config, { confirm, ...options } = {}) {
  const project = await cargo.projectMetadata();
  const { chainId, urls: { rpc } = {}, gas = {} } = config.get('network', {});
  const node = `${rpc.url}:${rpc.port}`;

  prompts.override(options);
  const { from } = await prompts([
    {
      type: 'text',
      name: 'from',
      message: chalk`Send tx from which wallet in your keychain? {reset.dim (e.g. "main" or crtl+c to quit)}`,
      validate: value => !_.isEmpty(value.trim()) || 'Invalid wallet label',
      format: value => _.trim(value),
    },
  ]);

  const flags = _.flatten([
    confirm ? [] : ['--yes'],
    // FIXME: --dry-run is not working as expected on archwayd
    // dryRun ? ['--dry-run'] : [],
  ]).filter(_.isString);

  return {
    project,
    from,
    chainId,
    node,
    gas,
    flags
  }
}

async function verifyChecksum(filename) {
  const fileBuffer = await readFile(filename);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

async function verifyUploadedWasm(archwayd, config, { project: { wasm: { optimizedFilePath } = {} } = {}, chainId, node, ...options } = {}) {
  const { codeId } = config.deployments.findLast('store', chainId);
  const downloadWasmName = `${path.basename(optimizedFilePath, '.wasm')}_download.wasm`;
  const localDownloadPath = path.join(path.dirname(optimizedFilePath), downloadWasmName);
  await retry(
    () => archwayd.query.wasmCode(codeId, localDownloadPath, { node }),
    { text: chalk`Downloading wasm file from {cyan ${chainId}}...` }
  );

  // We need to update the path to where the docker container volume is mapped to
  const remotePath = path.join(archwayd.workingDir, optimizedFilePath);
  const remoteDownloadPath = path.join(path.dirname(remotePath), downloadWasmName);
  if (!await pathExists(remoteDownloadPath)) {
    throw new Error(`Failed to locate downloaded wasm file at ${remoteDownloadPath}`);
  }

  const localChecksum = await verifyChecksum(remotePath);
  const onChainChecksum = await verifyChecksum(remoteDownloadPath);
  if (localChecksum !== onChainChecksum) {
    throw new Error(`Local wasm file does not match on-chain checksum local=${localChecksum} on-chain=${onChainChecksum}`);
  }

  console.info(chalk`{green Integrity check Ok!}\n`);
}

async function storeWasm(archwayd, config, { project: { wasm: { optimizedFilePath } = {} } = {}, from, chainId, node, ...options } = {}) {
  console.info(chalk`Uploading optimized executable to {cyan ${chainId}} using wallet {cyan ${from}}...`);

  // If we use docker or for any reason need to copy the file to any other directory before upload
  // TODO: remove after dropping Docker support
  const remotePath = path.join(archwayd.workingDir, optimizedFilePath);
  if (!_.isEmpty(path.relative(optimizedFilePath, remotePath))) {
    console.info(`Copying file ${optimizedFilePath} to ${remotePath}`);
    await mkdir(path.dirname(remotePath), { recursive: true });
    await copyFile(optimizedFilePath, remotePath);
  }

  const { txhash } = await archwayd.tx.wasm('store', [optimizedFilePath], { from, chainId, node, ...options });
  // FIXME: add retry logic
  const codeIdString = await retry(
    () => archwayd.query.txEventAttribute(txhash, 'store_code', 'code_id', { node, printStdout: false }),
    { text: chalk`Waiting for tx {cyan ${txhash}} to confirm...` }
  );
  const codeId = _.toNumber(codeIdString);
  if (!txhash || !codeId) {
    throw new Error(`Failed to upload wasm file ${optimizedFilePath}`);
  }

  await config.deployments.add({
    type: 'store',
    chainId,
    codeId,
    txhash
  });

  console.info(chalk`{green Uploaded {cyan ${optimizedFilePath}} with code id {cyan ${codeId}} on tx hash {cyan ${txhash}} to {cyan ${chainId}}}\n`);
}

async function storeAndVerify(archwayd, { store = true, verify = true, deployOptions, ...options } = {}) {
  const config = await Config.open();
  const cargo = new Cargo();

  deployOptions = deployOptions || await parseDeploymentOptions(cargo, config, options);

  store && await storeWasm(archwayd, config, deployOptions);
  verify && await verifyUploadedWasm(archwayd, config, deployOptions);
}

async function main(archwayd, options = {}) {
  try {
    await storeAndVerify(archwayd, options);
  } catch (e) {
    if (e instanceof PromptCancelledError) {
      console.warn(chalk`{yellow ${e.message}}`);
    } else {
      console.error(chalk`\n{red.bold Failed to store contract}`);
      console.error(e);
      process.exit(1);
    }
  }
}

module.exports = main;
