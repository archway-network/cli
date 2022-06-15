// archway-cli/util/network.js

const _ = require('lodash');
const chalk = require('chalk');
const Config = require('../util/config');
const { prompts, PromptCancelledError } = require('../util/prompts');
const { Environments, EnvironmentsDetails, Testnets, TestnetsDetails, loadNetworkConfig } = require('../networks');


const MigrateQuestions = (currentEnvironment, currentTestnet) => [
  {
    type: 'confirm',
    name: 'migrate',
    message: 'Do you want to migrate to another network?',
    initial: false
  },
  {
    type: (_prev, answers) => answers.migrate ? 'select' : null,
    name: 'environment',
    message: 'Select the project environment',
    initial: _.indexOf(Environments, currentEnvironment),
    choices: _.map(EnvironmentsDetails, (details, name) => ({
      title: _.capitalize(name),
      value: name,
      ...details
    })),
    warn: 'This environment is unavailable for now'
  },
  {
    type: (prev, answers) => (answers.migrate && prev === 'testnet') ? 'select' : null,
    name: 'testnet',
    message: 'Select a testnet to use',
    initial: _.indexOf(Testnets, currentTestnet),
    choices: _.map(TestnetsDetails, (details, name) => ({
      title: _.capitalize(name),
      value: name,
      ...details
    })),
    warn: 'This network is unavailable for now'
  }
];

async function migrateNetworks(currentChainId, currentEnvironment, currentTestnet) {
  const { migrate, environment, testnet } = await prompts(MigrateQuestions(currentEnvironment, currentTestnet))

  if (!migrate) {
    return;
  }

  console.info(chalk`Migrating to {cyan ${testnet}}...`);

  const { network: newNetworkConfig } = loadNetworkConfig(environment, testnet);
  await Config.update({ network: newNetworkConfig });

  console.info(chalk`{green Migrated from {cyan ${currentChainId}} to {cyan ${newNetworkConfig.chainId}}}`);
}

async function printNetworkConfig() {
  console.info('Printing network settings...');

  const {
    network: {
      name: networkName,
      chainId,
      type: currentEnvironment = 'testnet',
      urls: {
        rpc = {},
      }
    } = {}
  } = await Config.read();

  const currentTestnet = (networkName || chainId.replace(/-1$/, ''));

  console.info();
  console.info(chalk`{bold Using:}  ${_.capitalize(currentTestnet)}`);
  console.info(chalk`{bold RPC:}    ${rpc.url}:${rpc.port}`);
  console.info();

  await migrateNetworks(chainId, currentEnvironment, currentTestnet);
}

async function main(options = {}) {
  try {
    prompts.override(options);
    await printNetworkConfig();
  } catch (e) {
    if (e instanceof PromptCancelledError) {
      console.warn(chalk`{yellow ${e.message}}`);
    } else {
      console.error(chalk`{red.bold Network configuration failed}`);
      console.error(e);
      process.exit(1);
    }
  }
}

module.exports = main;
