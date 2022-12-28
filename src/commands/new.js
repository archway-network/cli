const _ = require('lodash');
const chalk = require('chalk');
const path = require('path');
const Cargo = require('../clients/cargo');
const { prompts, PromptCancelledError } = require('../util/prompts');
const { Config } = require('../util/config');
const { isProjectName } = require('../util/validators');
const { Prompts } = require('../networks');


const TemplatesRepository = 'https://github.com/archway-network/archway-templates';
const Templates = [
  { title: 'Increment', value: 'increment' },
  { title: 'CW20', value: 'cw20/base' },
  { title: 'CW20 escrow', value: 'cw20/escrow' },
  { title: 'CW721 with on-chain metadata', value: 'cw721/on-chain-metadata' },
];
const DefaultTemplate = 'default';
const DefaultTemplateBranch = 'main';

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
    choices: _.map(Templates, template => {
      return {
        description: `[https://github.com/${TemplatesRepository}/tree/main/${template.value}]`,
        ...template
      };
    }),
  },
  {
    type: 'confirm',
    name: 'docker',
    message: 'Use Docker to run the archwayd daemon?',
    initial: false
  },
  Prompts.environment,
  Prompts.testnet,
];


async function createProject({ cwd, build, ...defaults } = {}) {
  const settings = await parseSettings(defaults);
  const config = await buildConfig({ cwd, ...settings });

  await cargoGenerate(config, settings);
  await cargoBuild(config, { build, settings });
  config.write();

  return config;
}

async function parseSettings(defaults) {
  prompts.override(_.omitBy({
    ...defaults,
    useTemplate: defaults.template ? true : undefined
  }, _.isUndefined));

  return await prompts(ProjectSetupQuestions);
}

/**
 * @param {{ cwd: string, name: string, ...settings: Map }} settings
 * @returns {Promise<Config>}
 * @private
 */
async function buildConfig({ cwd, name, ...settings }) {
  const sanitizedName = name.toLowerCase().replace(/_/g, '-').replace(/ /g, '-');
  const projectRootPath = path.join(cwd, sanitizedName);
  return await Config.init(sanitizedName, settings, projectRootPath);
}

/**
 * @param {Config} config
 * @param {{ template: string }} options
 * @returns {Promise<void>}
 * @private
 */
async function cargoGenerate(config, { template = DefaultTemplate }) {
  await new Cargo().generate(config.data.name, TemplatesRepository, DefaultTemplateBranch, template);
}

/**
 * @param {Config} config
 * @param {{ build: boolean }} options
 * @returns {Promise<void>}
 * @private
 */
async function cargoBuild(config, { build = false } = {}) {
  if (!build) {
    return;
  }

  await new Cargo({ cwd: config.projectRootDir }).build();
}

async function main(name, { cwd, ...options }) {
  console.info(`Creating new Archway project...`);
  try {
    const workingDir = cwd || process.cwd();
    const config = await createProject({ name, cwd: workingDir, ...options });
    console.info(chalk`\n{green Successfully created project {cyan ${config.data.name}} with network configuration {cyan ${config.data.network.chainId}}}`);
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
