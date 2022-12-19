// archway-cli/util/deployments.js

const _ = require('lodash');
const chalk = require('chalk');
const { Config } = require('../util/config');
const { Table } = require('console-table-printer');

function printDeployments(deployments) {
  const p = new Table({
    enabledColumns: ['type', 'chainId', 'codeId', 'txhash', 'extra'],
    computedColumns: [
      {
        name: 'extra',
        function: row => _.truncate(
          JSON.stringify(_.omit(row, ['type', 'chainId', 'codeId', 'txhash'])),
          { length: 20 }
        ),
      },
    ]
  });
  p.addRows(deployments);
  p.printTable();
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
