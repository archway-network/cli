// archway-cli/util/deployments.js

const FileSystem = require('fs');
const StringUtility = require('util');

function printDeployments() {
  console.log('Printing deployments...\n');

  let configPath = process.cwd() + '/config.json';
  FileSystem.access(configPath, FileSystem.F_OK, (err) => {
    if (err) {
      console.error('Error locating dApp config at path ' + configPath + '.\nPlease run this command from the root folder of valid Archway project.');
      return;
    } else {
      let config = require(configPath);
      let deployments = config.developer.deployments;
      if (!deployments.length) {
        console.log("No deployments in config history.\nDeployments: ", deployments);
      } else {
        console.log(StringUtility.inspect(deployments, false, null, true));
      }
    }
  })
};

const handlePrintDeployments = () => {
  printDeployments();
};

module.exports = handlePrintDeployments;