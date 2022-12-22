// archway-cli/util/network.js

const _ = require('lodash');
const chalk = require('chalk');
const { Config } = require('../util/config');
const { prompts, PromptCancelledError } = require('../util/prompts');
const { Environments, Testnets, Prompts, loadNetworkConfig } = require('../networks');


const MigrateQuestions = (currentEnvironment, currentTestnet) => [
  {
    ...Prompts.environment,
    initial: currentEnvironment ? _.indexOf(Environments, currentEnvironment) : Prompts.environment.initial,
  },
  {
    ...Prompts.testnet,
    initial: currentTestnet ? _.indexOf(Testnets, currentTestnet) : Prompts.testnet.initial,
  }
];

async function migrateNetworks(config, { chainId: currentChainId, currentEnvironment, currentTestnet }) {
  const questions = MigrateQuestions(currentEnvironment, currentTestnet);
  const { environment, testnet } = await prompts(questions);
  const { network: newNetworkConfig } = loadNetworkConfig(environment, testnet);
  await config.update({ network: newNetworkConfig });

  console.info(chalk`{green Migrated from {cyan ${currentChainId}} to {cyan ${newNetworkConfig.chainId}}}`);
}

function printNetworkConfig({ chainId, currentEnvironment, currentTestnet, rpc }) {
  console.info('Current network settings...');
  console.info();
  console.info(chalk`{bold Chain ID:}    ${chainId}`);
  console.info(chalk`{bold Environment:} ${_.capitalize(currentEnvironment)}`);
  console.info(chalk`{bold Testnet:}     ${_.capitalize(currentTestnet)}`);
  console.info(chalk`{bold RPC:}         ${rpc.url}:${rpc.port}`);
  console.info();
}

function parseNetworkConfig(config) {
  const {
    network: {
      name: networkName,
      chainId,
      type: currentEnvironment = 'testnet',
      urls: {
        rpc = {},
      }
    } = {}
  } = config.data;
  const currentTestnet = currentEnvironment === 'testnet' ? (networkName || chainId.replace(/-1$/, '')) : undefined;

  return {
    chainId,
    currentEnvironment,
    currentTestnet,
    rpc
  };
}

async function main({ migrate, ...options }) {
  try {
    prompts.override(options);

    const config = await Config.open();
    const networkConfig = parseNetworkConfig(config);

    if (migrate) {
      await migrateNetworks(config, networkConfig);
    } else {
      printNetworkConfig(networkConfig);
    }
  } catch (e) {
    if (e instanceof PromptCancelledError) {
      console.warn(chalk`{yellow ${e.message}}`);
    } else {
      console.error(chalk`{red.bold Network configuration failed}`);
      console.error(chalk`{red ${e.message}}`);
    }
    throw e;
  }
}

module.exports = main;
