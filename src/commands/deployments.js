// archway-cli/util/deployments.js

const _ = require('lodash');
const chalk = require('chalk');
const { Config } = require('../util/config');

function printDeployments(deployments) {
  _.chain(deployments)
    .groupBy('project')
    .forEach((deployments, project) => {
      console.info(chalk`{cyan.bold ${project}}\n`);

      deployments.forEach(deployment => {
        _.chain(deployment)
          .omit(['project'])
          .forEach((value, key) => {
            const parsedValue = _.isObject(value) ? JSON.stringify(value) : value;
            console.info(chalk`{bold ${key}:} ${parsedValue}`);
          })
          .value();

        console.info('');
      });
    })
    .value();
}

async function main({ all = false }) {
  try {
    const config = await Config.open();
    const deployments = all ? config.deployments.list() : config.deployments.listByChainId();
    printDeployments(deployments);
  } catch (e) {
    console.error(chalk`{red.bold Failed to list deployments}`);
    throw e;
  }
}

module.exports = main;
