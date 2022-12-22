const chalk = require('chalk');
const path = require('node:path');
const { Config } = require('../util/config');
const { prompts, PromptCancelledError } = require('../util/prompts');
const { Prompts } = require('../networks');
const Cargo = require('../clients/cargo');


const Questions = [Prompts.environment, Prompts.testnet];

async function initializeConfig() {
  const { environment, testnet } = await prompts(Questions);

  const cargo = new Cargo();
  const { workspaceRoot } = await cargo.projectMetadata();
  const name = path.basename(workspaceRoot);

  const config = await Config.init(name, { environment, testnet }, workspaceRoot);
  await config.write();
}

async function printConfig() {
  const config = await Config.open();
  console.info(JSON.stringify(config.data, null, 2));
}

async function main({ init = false, ...options }) {
  try {
    if (init) {
      prompts.override(options);
      await initializeConfig();
    } else {
      await printConfig();
    }
  } catch (e) {
    if (e instanceof PromptCancelledError) {
      console.warn(chalk`{yellow ${e.message}}`);
    } else {
      console.error(chalk`{red.bold Failed to configure project}`);
      console.error(chalk`{red ${e.message}}`);
      throw e;
    }
  }
}

module.exports = main;
