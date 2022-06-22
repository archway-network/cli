// archway-cli/util/new.js

const _ = require('lodash');
const chalk = require('chalk');
const path = require('path');
const { spawn } = require('promisify-child-process');
const Cargo = require('../clients/cargo');
const { prompts, PromptCancelledError } = require('../util/prompts');
const Config = require('../util/config');
const { isProjectName } = require('../util/validators');
const { Environments, EnvironmentsDetails, Testnets, TestnetsDetails, loadNetworkConfig } = require('../networks');


const TemplatesRepository = 'archway-network/archway-templates';
const Templates = [
  { title: 'Increment', value: 'increment' },
  { title: 'CW20', value: 'cw20/base' },
  { title: 'CW721 with off-chain metadata', value: 'cw721/off-chain-metadata' },
  { title: 'CW721 with on-chain metadata', value: 'cw721/on-chain-metadata' },
];
const DefaultTemplate = 'default';
const DefaultTemplateBranch = 'main';

const DefaultEnvironment = 'testnet';
const DefaultTestnet = 'constantine';

const ProjectSetupQuestions = [
  {
    type: 'text',
    name: 'name',
    message: 'Choose a name for your project',
    validate: value => isProjectName(value) || 'Please inform a valid project name',
    format: value => _.trim(value),
  },
  {
    type: 'confirm',
    name: 'useTemplate',
    message: 'Do you want to use a starter template?',
    initial: false
  },
  {
    type: prev => prev ? 'select' : null,
    name: 'template',
    message: 'Choose a template',
    choices: _.map(Templates, template => { return {
      description: `[https://github.com/${TemplatesRepository}/tree/main/${template.value}]`,
      ...template
    }; }),
  },
  {
    type: 'confirm',
    name: 'docker',
    message: 'Use Docker to run the archwayd daemon?',
    initial: true
  },
  {
    type: 'select',
    name: 'environment',
    message: 'Select the project environment',
    initial: _.indexOf(Environments, DefaultEnvironment),
    choices: _.map(EnvironmentsDetails, (details, name) => { return {
      title: _.capitalize(name),
      value: name,
      ...details
    }; }),
    warn: 'This environment is unavailable for now'
  },
  {
    type: prev => (prev === 'testnet') ? 'select' : null,
    name: 'testnet',
    message: 'Select a testnet to use',
    initial: _.indexOf(Testnets, DefaultTestnet),
    choices: _.map(TestnetsDetails, (details, name) => { return {
      title: _.capitalize(name),
      value: name,
      ...details
    }; }),
    warn: 'This network is unavailable for now'
  }
];


async function createProject(defaults = {}) {
  const settings = await parseSettings(defaults);
  const config = buildConfig(settings);

  await cargoGenerate(config, settings);
  await cargoBuild(config, settings);
  await writeConfigFile(config);
  await initialCommit(config);

  return config;
}

async function parseSettings(defaults) {
  prompts.override(_.omitBy({
    ...defaults,
    useTemplate: defaults.template ? true : undefined
  }, _.isUndefined));

  return await prompts(ProjectSetupQuestions);
}

function buildConfig({ name, docker, environment, testnet }) {
  const networkConfig = loadNetworkConfig(environment, testnet);
  const projectConfig = {
    name: name.toLowerCase().replace(/_/g, '-').replace(/ /g, '-'),
    developer: {
      archwayd: { docker }
    }
  };

  return _.defaultsDeep(projectConfig, networkConfig);
}

async function cargoGenerate({ name, network: { name: networkName, templatesBranch } }, { template = DefaultTemplate }) {
  const branch = templatesBranch || (networkName ? `network/${networkName}` : DefaultTemplateBranch);
  await new Cargo().generate(name, TemplatesRepository, branch, template);
}

async function cargoBuild({ name }, { build = true } = {}) {
  if (!build) {
    return;
  }

  const rootPath = path.join(process.cwd(), name);
  await new Cargo({ cwd: rootPath }).build();
}

async function writeConfigFile(config) {
  const { name } = config;
  await Config.write(config, name);
}

async function initialCommit({ name }) {
  const rootPath = path.join(process.cwd(), name);
  const git = async (...args) => spawn('git', ['-C', rootPath, ...args], { stdio: 'inherit' });
  await git('checkout', '-b', 'main');
  await git('add', '-A');
  await git('commit', '-m', 'Initialized with archway-cli');
}

async function main(name, options = {}) {
  console.info(`Creating new Archway project...`);
  try {
    const config = await createProject({ name, ...options });
    console.info(chalk`\n{green Successfully created project {cyan ${config.name}} with network configuration {cyan ${config.network.chainId}}}`);
  } catch (e) {
    if (e instanceof PromptCancelledError) {
      console.warn(chalk`{yellow ${e.message}}`);
    } else {
      console.error(chalk`\n{red.bold Failed to create project}`);
      console.error(e);
    }
  }
}

module.exports = main;
