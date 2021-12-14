// archway-cli/util/new.js

const { spawn } = require('child_process');
const FileSystem = require('fs');
const util = require('util');
const { createInterface } = require('readline');

const Testnet = {
  constantine: require('../data/testnet.constantine.json'),
  titus: require('../data/testnet.titus.json')
};

const TemplatesRepository = 'archway-network/archway-templates';

// XXX TODO: Import repos from json in ../data
const Templates = [
  { label: 'Increment', subfolder: 'increment' },
  { label: 'CW721 with off-chain metadata', subfolder: 'cw721/off-chain-metadata' },
  { label: 'CW721 with on-chain metadata', subfolder: 'cw721/on-chain-metadata' },
];
const baseVersion = '0.0.1';

async function ask(readline, query, defaultValue = null) {
  const question = util.promisify(readline.question).bind(readline);
  return await question(`${query} (default: ${defaultValue}): `) || defaultValue;
}

async function askBoolean(readline, query, defaultValue = 'N') {
  const answer = await ask(readline, `${query} [Y/N]`, defaultValue);
  return (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
}

async function askNumber(readline, query, defaultValue = null) {
  const answer = await ask(readline, query, defaultValue);
  return parseInt(answer);
}

async function doCloneRepository(config = null, template = null) {
  if (!config || !template) {
    console.error('Error creating project with settings', [config, template]);
  } else if (!config.title) {
    console.error('Error creating project with settings', [config, template]);
  } else {
    const source = spawn('cargo', ['generate', '--git', TemplatesRepository, '--name', config.title, template.subfolder], { stdio: 'inherit' });

    source.on('error', (err) => {
      console.error(`Error generating project ${config.title}`, err);
    });

    source.on('close', () => {
      config.type = template;
      doCreateConfigFile(config);
    });
  }
}

function doCreateConfigFile(config = null) {
  if (!config) {
    console.error('Error creating config file', config);
  } else if (typeof config !== 'object') {
    console.error('Error creating config file', config);
  } else if (!config.title || !config.version || !config.network || !config.path || !config.type) {
    console.error('Error creating config file', config);
  }

  let path = process.cwd() + '/' + config.title + '/config.json';
  let json = JSON.stringify(config, null, 2);

  FileSystem.writeFile(path, json, (err) => {
    if (err) {
      console.error('Error writing config to file system', [config, err]);
      return;
    }

    doAddFiles(config, path);
  });
}

function doAddFiles(config = null, configFilePath = null) {
  const source = spawn('git', ['-C', config.path, 'add', '-A'], { stdio: 'inherit' });

  let title = (config['title']) ? config.title : null;
  source.on('error', (err) => {
    console.error(`Error generating project ${title}`, err);
  });

  source.on('close', () => {
    doInitialCommit(config, configFilePath);
  });
}

function doInitialCommit(config = null, configFilePath = null) {
  const source = spawn('git', ['-C', config.path, 'commit', '-m', 'Initialized with archway-cli'], { stdio: 'inherit' });

  let title = (config['title']) ? config.title : null;
  source.on('error', (err) => {
    console.error(`Error generating project ${title}`, err);
  });

  source.on('close', () => {
    console.error(`Successfully created new ${config.type} project in path ${config.path} with network configuration ${config.network.chainId}.\nConfig file location: ${configFilePath}\n`);
  });
}

async function selectTemplate(readline) {
  const useTemplate = await askBoolean(readline, 'Use starter template?', 'N');
  if (!useTemplate) {
    return { label: 'Default', subfolder: 'default' };
  }

  let selected = 0;
  do {
    console.log('');
    Templates.forEach((value, index) => {
      console.log(`${index + 1}. ${value.label} [https://github.com/${TemplatesRepository}/tree/main/${value.subfolder}]`);
    });
    selected = await askNumber(readline, `\nSelect starter template [1-${Templates.length}]`, 1);
  } while (!(selected >= 1 && selected <= Templates.length))

  return Templates[selected - 1];
}

function selectNetworkConfig(configIndex, defaultTestnet) {
  switch (configIndex) {
    case 1:
      return (defaultTestnet !== 2) ? Testnet.constantine : Testnet.titus;
    case 2:
      throw 'XXX TODO: Localhost';
    case 3:
      throw 'XXX TODO: Mainnet';
    default:
      return Testnet.constantine;
  }
}

async function makeConfig(readline, configIndex, defaultTestnet = 1, docker = false) {
  // XXX TODO: Remove this when ready to unveil
  if (configIndex !== 1) {
    console.warn('Please use the Testnet configuration for now.');
    throw 'XXX TODO: Localhost, Mainnet configurations';
  }

  const networkConfig = selectNetworkConfig(configIndex, defaultTestnet);
  const template = await selectTemplate(readline);
  const title = await ask(readline, 'Name of the project', 'My Project');

  // Toggle `archwayd` type
  if (docker && networkConfig['developer']) {
    networkConfig.developer.archwayd.docker = true;
  }
  networkConfig.title = title.trim().split(' ').join('-').toLowerCase();
  networkConfig.version = baseVersion;

  console.log('networkConfig', JSON.stringify(networkConfig));
  console.log('template', template);

  await doCloneRepository(networkConfig, template);
}

const newArchway = async () => {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('Creating new Archway dApp...\n');

  let configIndex = 1, defaultTestnet = 1;

  try {
    const useDocker = await askBoolean(readline, 'Use Docker to run "archwayd" daemon?', 'Y');
    const configure = await askBoolean(readline, 'Configure environment?', 'N');
    if (configure) {
      do {
        console.log('\n1. Testnet\n2. Localhost\n3. Mainnet\n');
        configIndex = await askNumber(readline, 'Select environment type [1-3]', 1);
      } while (!(configIndex >= 1 && configIndex <= 3))

      if (configIndex == 1) {
        do {
          console.log('\n1. Constantine [stable]\n2. Titus [nightly]\n');
          defaultTestnet = await askNumber(readline, 'Select a testnet to use [1-2]', 1);
        } while (!(defaultTestnet >= 1 && defaultTestnet <= 2))
      }
    }

    await makeConfig(readline, configIndex, defaultTestnet, useDocker);
  } catch (err) {
    console.error('Error creating new project', err);
  }

  readline.close();
};

module.exports = newArchway;
