// archway-cli/util/configure.js

const FileSystem = require('fs');
const StringUtility = require('util');
const ConfigTools = require('../constants/config');

async function printDevConfig() {
  console.log('Printing environment settings...\n');

  let configPath = ConfigTools.path();
  FileSystem.access(configPath, FileSystem.F_OK, (err) => {
    if (err) {
      console.error('Error locating dApp config at path ' + configPath + '.\nPlease run this command from the root folder of valid Archway project.');
      return;
    } else {
      let config = require(configPath);
      console.log(StringUtility.inspect(config, false, null, true));
    }
  });
}

async function doCreateConfigFile(config = null) {
  if (!config) {
    console.log('Error creating config file', config);
  } else if (typeof config !== 'object') {
    console.log('Error creating config file', config);
  } else if (!(config.title || config.name) || !config.network || !config.path || !config.type) {
    console.log('Error creating config file', config);
  }

  let path = ConfigTools.path();
  let json = JSON.stringify(config, null, 2);

  FileSystem.writeFile(path, json, (err) => {
    if (err) {
      console.log('Error writing config to file system', [config, err]);
    }
    else {
      console.log('Successfully updated config file: ' + path + '\n');
    }
  });
}

async function modifyConfig(key = null) {
  if (!key || typeof key !== 'string') {
    console.log(`Key "${key}" not found in config`);
    return;
  } else {
    let configPath = ConfigTools.path(), config;
    FileSystem.access(configPath, FileSystem.F_OK, (err) => {
      if (err) {
        console.error('Error locating dApp config at path ' + configPath + '.\nPlease run this command from the root folder of valid Archway project.');
        return;
      } else {
        config = require(configPath);
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });

        if (!config[key]) {
          console.error(`${key} does not exist in config`);
          readline.question('Print current config? (Y/N default: N): ', doPrintConfig => {
            if (doPrintConfig.toLowerCase() !== 'y' && doPrintConfig.toLowerCase() !== 'yes') {
              readline.close();
              return;
            } else {
              printDevConfig();
              readline.close();
              return;
            }
          });
        } else {
          let currentValue = config[key];
          console.log('The current value of ' + key + ' is: ', StringUtility.inspect(currentValue, false, null, true));
          readline.question('Enter new value (ctrl+c to quit): ', newValue => {
            let value = newValue.trim();
            if (value.indexOf('{') > -1 && value.indexOf('}') > -1) {
              value = JSON.parse(value);
            }
            config[key] = value;
            doCreateConfigFile(config);
            readline.close();
            return;
          });
        }
      }
    });
  }
}

const configureEnv = (modify = false, key = null) => {
  if (modify) {
    modifyConfig(key);
  } else {
    printDevConfig();
  }
};

module.exports = configureEnv;
