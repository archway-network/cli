// archway-cli/util/faucet.js

const _ = require('lodash');
const chalk = require('chalk');
const { prompts, PromptCancelledError } = require('../util/prompts');
const ora = require('ora');
const HttpClient = require('axios');
const { Testnets, loadNetworkConfig } = require('../networks');
const { isArchwayAddress } = require('../util/validators');

async function sendRequest(address, faucet, feeDenom) {
  const request = { denom: feeDenom, address };
  const response = await HttpClient.post(faucet, request);

  const { status, data } = response;
  if (status !== 200) {
    throw new Error(`Request failed with status ${status}\n${JSON.stringify(data)}`);
  }

  const { transfers: [{ status: transferStatus, coin, error }] } = data;
  if (transferStatus !== 'ok') {
    throw new Error(error);
  }

  return { coin };
}

async function requestFunds(address, testnet) {
  const {
    network: {
      chainId,
      fees: { feeDenom },
      urls: { faucets: [faucet,] }
    }
  } = loadNetworkConfig('testnet', testnet);

  const request = sendRequest(address, faucet, feeDenom);

  ora.promise(request, chalk`Requesting faucet funds to address {cyan ${address}} on network {cyan ${chainId}}`);

  const { coin } = await request;

  console.info(chalk`{green Successfully sent {cyan ${coin}} to address}`);
}

async function promptAddress(archwayd) {
  const { address } = await prompts({
    type: 'text',
    name: 'address',
    message: chalk`Enter address to request funds to, or hit <enter> to list all accounts {reset.dim (e.g.: archway1...)}`,
    validate: value => _.isEmpty(_.trim(value)) || isArchwayAddress(_.trim(value)) || 'Invalid address',
    format: value => _.trim(value),
  });

  if (_.isEmpty(address)) {
    await archwayd.keys.list();
    return await promptAddress(archwayd);
  }

  return address;
}

async function main(archwayd, options = {}) {
  const { testnet } = options;

  try {
    if (!Testnets.includes(testnet)) {
      throw new Error('Requesting faucet funds is only possible from a testnet network configuration');
    }

    prompts.override(options);
    const address = await promptAddress(archwayd);
    await requestFunds(address, testnet);
  } catch (e) {
    if (e instanceof PromptCancelledError) {
      console.warn(chalk`{yellow ${e.message}}`);
    } else {
      console.error(chalk`\n{red {bold Failed to request funds from faucet}\n${e.message || e}}`);
    }
  }
}

module.exports = main;
