// archway-cli/util/new.js

const { spawn } = require("child_process");

const Testnet = require('../data/testnet.json');

const repos = [
  {label:'Increment', docs:'', git:'https://github.com/CosmWasm/cosmwasm-template.git'}
];
const ok = [1];
const baseVersion = '0.0.1';

async function doCloneRepository(config = null, repo = null) {
  if (!config || !repo) {
    console.log('Error creating project with settings', [config, repo]);
  } else if (!config.title) {
    console.log('Error creating project with settings', [config, repo]);
  } else {
    switch (repo) {
      case repos[0].label: {
        // cargo generate --git https://github.com/CosmWasm/cosmwasm-template.git --name YOUR_PROJECT_NAME
        const source = spawn('cargo', ['generate', '--git', repos[0].git, '--name', config.title], { stdio: 'inherit' });
        
        source.on('error', (err) => {
          console.log(`Error generating project ${title}`, err);
        });
        break;
      }
    }
  }
};

function makeConfig() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Use starter template? (Y/N default: Y): ', useTemplate => {
    if (useTemplate.toLowerCase() !== 'y' && useTemplate.toLowerCase() !== 'yes') {
      console.log('TODO: Blank slate project clone');
      readline.close();
    } else {
      for (let i=0; i<repos.length; i++) {
        let msg = String(i+1) + '. ' + repos[i].label;
        if (repos[i].docs) {
          msg += ' [' + repos[i].docs + ']'
        }
        console.log(msg);
      }
      readline.question('Select starter template (1-1): ', template => {
        let selected = parseInt(template), repo;
        if (ok.indexOf(selected) == -1) {
          console.log('Error selecting project template', [selected, template]);
          readline.close();
        } else {
          repo = repos[selected-1];
          readline.question('Name of project ("My Project") ', title => {
            let projectName = title.trim();
            let networkConfig = Testnet;
            projectName = projectName.split(' ');
            projectName = projectName.join('-').toLowerCase();
            networkConfig.title = projectName;
            networkConfig.version = baseVersion;
            doCloneRepository(networkConfig, repo.label);
            readline.close();
          });
        }
      });
    }
  });
};

const newArchway = async () => {
  console.log('Creating new Archway dApp...\n');

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Configure environment (Y/N default: Y)?: ', configure => {
    let envI;
    if (configure.toLowerCase() !== 'y' && configure.toLowerCase() !== 'yes') {
      envI = 1;
      readline.close();
      makeConfig(1);
    } else {
      console.log('\n1. Testnet\n2. Localhost\n3. Mainnet\n');
      readline.question('Select environment type (1-3 default: 1): ', environment => {
        envI = parseInt(environment);
        if (envI !== 1 && envI !== 2 && envI !== 3) {
          console.log('Ok!');
          readline.close();
        } else {
          readline.close();
          makeConfig(envI);
        }
      });
    }
  });
};

module.exports = newArchway;