const _ = require('lodash');
const chalk = require('chalk');
const { prompts, PromptCancelledError } = require('../util/prompts');
const crypto = require('node:crypto');
const path = require('node:path');
const { readFile, copyFile, mkdir } = require('fs/promises');
const { pathExists } = require('../util/fs');
const { Config } = require('../util/config');
const retry = require('../util/retry');
const Cargo = require('../clients/cargo');

// eslint-disable-next-line no-unused-vars
const ArchwayClient = require('../clients/archwayd');

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
  ]).filter(_.isString);

  return {
    ...options,
    project,
    from,
    chainId,
    node,
    gas,
    flags
  };
}

async function verifyChecksum(filename) {
  const fileBuffer = await readFile(filename);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Verifies that the wasm file uploaded to the chain matches the local file.
 *
 * @param {ArchwayClient} archwayd
 * @param {Config} config
 */
async function verifyUploadedWasm(
  archwayd,
  config,
  {
    project: { name: projectName, wasm: { optimizedFilePath } = {}, workspaceRoot } = {},
    chainId,
    node
  } = {}
) {
  const { codeId } = config.deployments.findLastByTypeAndProjectAndChainId('store', projectName, chainId);
  const relativeWasmPath = path.relative(workspaceRoot, optimizedFilePath);
  const downloadWasmName = `${path.basename(relativeWasmPath, '.wasm')}_download.wasm`;
  const localDownloadPath = path.join(relativeWasmPath, '..', downloadWasmName);
  await retry(
    () => archwayd.query.wasmCode(codeId, localDownloadPath, { node }),
    { text: chalk`Downloading wasm file from {cyan ${chainId}}...` }
  );

  // We need to update the path to where the docker container volume is mapped to
  const remotePath = path.join(archwayd.workingDir, relativeWasmPath);
  const remoteDownloadPath = path.join(remotePath, '..', downloadWasmName);
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

/**
 * Uploads the optimized wasm file to the chain.
 *
 * If the file is in a directory not accessible by the DockerArchwayClient,
 * it will be copied to its working directory before uploading.
 *
 * @param {ArchwayClient} archwayd
 * @param {Config} config
 */
async function storeWasm(archwayd, config, { project: { name: projectName, wasm: { optimizedFilePath } = {}, workspaceRoot } = {}, from, chainId, node, ...options } = {}) {
  console.info(chalk`Uploading optimized wasm to {cyan ${chainId}} using wallet {cyan ${from}}...`);

  const relativeWasmPath = path.relative(workspaceRoot, optimizedFilePath);
  const resolvedWasmPath = path.join(archwayd.workingDir, relativeWasmPath);
  if (!_.isEmpty(path.relative(optimizedFilePath, resolvedWasmPath))) {
    console.info(chalk`{dim Copying file {cyan ${optimizedFilePath}} to {cyan ${resolvedWasmPath}}}`);
    await mkdir(path.dirname(resolvedWasmPath), { recursive: true });
    await copyFile(optimizedFilePath, resolvedWasmPath);
  }

  // eslint-disable-next-line camelcase
  const { code, raw_log: rawLog, txhash } = await archwayd.tx.wasm('store', [relativeWasmPath], { from, chainId, node, ...options });
  if (code && code !== 0) {
    throw new Error(`Transaction failed: code=${code}, ${rawLog}`);
  }
  const codeIdString = await retry(
    () => archwayd.query.txEventAttribute(txhash, 'store_code', 'code_id', { node }),
    { text: chalk`Waiting for tx {cyan ${txhash}} to confirm...` }
  );
  const codeId = _.toNumber(codeIdString);
  if (!txhash || !codeId) {
    throw new Error(`Failed to upload wasm file ${optimizedFilePath}`);
  }

  await config.deployments.add({
    project: projectName,
    type: 'store',
    chainId,
    codeId,
    txhash
  });

  console.info(chalk`\n{green File {cyan ${optimizedFilePath}} successfully uploaded}`);
  console.info(chalk`{white   Chain Id: {cyan ${chainId}}}`);
  console.info(chalk`{white   Tx Hash:  {cyan ${txhash}}}`);
  console.info(chalk`{white   Code Id:  {cyan ${codeId}}}\n`);
}

async function storeAndVerify(archwayd, { store = true, verify = true, deployOptions, ...options } = {}) {
  const config = await Config.open();
  const cargo = new Cargo();

  deployOptions ||= await parseDeploymentOptions(cargo, config, options);

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
    }
    throw e;
  }
}

module.exports = main;
