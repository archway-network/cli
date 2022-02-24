// archway-cli/util/new.js

const _ = require('lodash');
const chalk = require('chalk');
const { spawn } = require('promisify-child-process');
const { prompts, PromptCancelledError } = require('../util/prompts');
const Config = require('../util/config');
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
const DefaultProjectVersion = '0.1.0';

const ProjectSetupQuestions = [
  {
    type: 'text',
    name: 'name',
    message: 'Choose a name for your project',
    validate: name => _.isEmpty(_.kebabCase(name)) ? 'Please inform a valid name for the project' : true,
    format: _.kebabCase,
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
    choices: _.map(Templates, template => ({
      description: `[https://github.com/${TemplatesRepository}/tree/main/${template.value}]`,
      ...template
    })),
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
    choices: _.map(EnvironmentsDetails, (details, name) => ({
      title: _.capitalize(name),
      value: name,
      ...details
    })),
    warn: 'This environment is unavailable for now'
  },
  {
    type: prev => (prev === 'testnet') ? 'select' : null,
    name: 'testnet',
    message: 'Select a testnet to use',
    initial: _.indexOf(Testnets, DefaultTestnet),
    choices: _.map(TestnetsDetails, (details, name) => ({
      title: _.capitalize(name),
      value: name,
      ...details
    })),
    warn: 'This network is unavailable for now'
  }
];


async function createProject(defaults = {}) {
  const settings = await parseSettings(defaults);
  const config = buildConfig(settings);

  await cargoGenerate(config, settings.template);
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
    name: name,
    version: DefaultProjectVersion,
    developer: {
      archwayd: { docker }
    }
  };

  return { ...networkConfig, ...projectConfig };
}

async function cargoGenerate({ name, network: { name: networkName } }, template = DefaultTemplate) {
  const branch = networkName ? `network/${networkName}` : DefaultTemplateBranch;
  await spawn('cargo', [
    'generate',
    '--name', name,
    '--git', TemplatesRepository,
    '--branch', branch,
    template
  ], { stdio: 'inherit' });
}

async function writeConfigFile(config) {
  const { name } = config;
  await Config.write(config, name);
}

async function initialCommit({ name }) {
  const git = async (...args) => spawn('git', ['-C', name, ...args], { stdio: 'inherit' });
  await git('add', '-A');
  await git('commit', '-m', 'Initialized with archway-cli');
}

async function main(name, options = {}) {
  console.info(`Creating new Archway project...`);

  try {
    const { network: { chainId } } = await createProject({ name, ...options });
    console.info(chalk`{green Successfully created project {cyan ${name}} with network configuration {cyan ${chainId}}}`);
  } catch (e) {
    if (e instanceof PromptCancelledError) {
      console.warn(chalk`{yellow ${e.message}}`);
    } else {
      console.error(chalk`{red.bold Failed to create project}\n${e.message || e}`);
    }
  }
}

module.exports = main;
