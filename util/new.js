// archway-cli/util/new.js

const { spawn } = require("child_process");
const FileSystem = require('fs');

const Testnet = {
  constantine: require('../data/testnet.constantine.json'),
  titus: require('../data/testnet.titus.json')
};

// XXX TODO: Import repos from json in ../data
const repos = [
  {label:'Increment', docs:'https://github.com/drewstaylor/archway-template/blob/main/README.md', git:'https://github.com/drewstaylor/archway-template.git'}
];
const ok = [1,2];
const baseVersion = '0.0.1';

async function doCloneRepository(config = null, repo = null) {
  if (!config || !repo) {
    console.log('Error creating project with settings', [config, repo]);
  } else if (!config.title) {
    console.log('Error creating project with settings', [config, repo]);
  } else {
    switch (repo) {
      case repos[0].label: {
        const source = spawn('cargo', ['generate', '--git', repos[0].git, '--name', config.title], { stdio: 'inherit' });
        
        source.on('error', (err) => {
          console.log(`Error generating project ${title}`, err);
        });

        source.on('close', () => {
          let path = process.cwd() + '/' + config.title;
          config.path = path;
          config.type = repo;
          doCreateConfigFile(config);
        });
        break;
      }
      case repos[1].label: {
        const source = spawn('cargo', ['generate', '--git', repos[1].git, '--name', 'queue'], { stdio: 'inherit' });
        
        source.on('error', (err) => {
          console.log(`Error generating project queue`, err);
        });

        source.on('close', () => {
          let path = process.cwd() + '/queue';
          config.path = path;
          config.type = repo;
          doCreateConfigFile(config);
        });
        break;
      }
    }
  }
};

function doCreateConfigFile(config = null) {
  if (!config) {
    console.log('Error creating config file', config);
  } else if (typeof config !== 'object') {
    console.log('Error creating config file', config);
  } else if (!config.title || !config.version || !config.network || !config.path || !config.type) {
    console.log('Error creating config file', config);
  }

  let path = config.path + '/config.json';
  let json = JSON.stringify(config, null, 2);

  FileSystem.writeFile(path, json, (err) => {
    if (err)
      console.log('Error writing config to file system', [config, err]);
    else {
      console.log('Successfully created new ' + config.type + ' project in path ' + config.path + ' with network configuration ' + config.network.chainId + '.\nConfig file location: ' + path + '\n');
    }
  });
}

function makeConfig(configIndex, defaultTestnet = 1, docker = false) {
  // XXX TODO: Remove this when ready to unveil
  if (parseInt(configIndex) !== 1) {
    console.log('Please use the Testnet configuration for now.');
    console.log('XXX TODO: Localhost, Mainnet configurations');
    return;
  }

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Use starter template? (Y/N default: N): ', useTemplate => {
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
      readline.question('Select starter template (1-1 default: 1): ', template => {
        if (!template) {
          template = 1;
        }
        let selected = parseInt(template), repo;
        if (ok.indexOf(selected) == -1) {
          console.log('Error selecting project template', [selected, template]);
          readline.close();
        } else {
          repo = repos[selected-1];
          readline.question('Name of project (default: "My Project"): ', title => {
            if (!title) {
              title = "My Project";
            }
            let projectName = title.trim();
            let networkConfig;
            switch (configIndex) {
              case 1:
              case '1':
                if (defaultTestnet !== 2) {
                  networkConfig = Testnet.constantine;
                } else {
                  networkConfig = Testnet.titus;
                }
                break;
              case 2:
              case '2':
                console.log('XXX TODO: Localhost');
                readline.close();
                return;
              case 3:
              case '3':
                console.log('XXX TODO: Mainnet');
                readline.close();
                return;
              default:
                networkConfig = Testnet.constantine;
            }
            // Toggle `archwayd` type
            if (docker && networkConfig['developer']) {
              networkConfig.developer.archwayd.docker = true;
            }
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

  readline.question('Configure environment (Y/N default: N)?: ', configure => {
    let envI, testnetI;
    let dockerArchwayD = false;
    if (configure.toLowerCase() !== 'y' && configure.toLowerCase() !== 'yes') {
      envI = 1;
      testnetI = 1;
      readline.question('Use Docker to run "archwayd" daemon (Y/N default: N)?: ', (archwaydType) => {
        if (archwaydType.toLowerCase() == 'y' || archwaydType.toLowerCase() !== 'yes') {
          dockerArchwayD = true;
        }
        // Make
        readline.close();
        makeConfig(envI, testnetI, dockerArchwayD);
      });
    } else {
      console.log('\n1. Testnet\n2. Localhost\n3. Mainnet\n');
      readline.question('Select environment type (1-3 default: 1): ', environment => {
        envI = parseInt(environment);
        if (envI !== 1 && envI !== 2 && envI !== 3) {
          envI = 1;
        }
        console.log('\n1. Constantine [stable]\n2. Titus [nightly]\n');
        readline.question('Select a testnet to use (1-2 default: 1): ', netIndex => {
          testnetI = parseInt(netIndex);
          readline.question('Use Docker to run "archwayd" daemon (Y/N default: N)?: ', (archwaydType) => {
            if (archwaydType.toLowerCase() == 'y' || archwaydType.toLowerCase() !== 'yes') {
              dockerArchwayD = true;
            }
            // Make
            readline.close();
            makeConfig(envI, testnetI, dockerArchwayD);
          });
        });
        
      });
    }
  });
};

module.exports = newArchway;