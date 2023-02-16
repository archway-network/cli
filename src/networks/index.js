const _ = require('lodash');

const EnvironmentsDetails = {
  local: { description: 'Used for local development' },
  testnet: { description: 'Testing networks for validators and dApp developers' },
  mainnet: { description: 'Production network', disabled: true },
};
const Environments = _(EnvironmentsDetails)
  .omitBy(_.property('disabled'))
  .keys()
  .value();
const DefaultEnvironment = 'testnet';

const TestnetsDetails = {
  constantine: { description: 'Stable - recommended for dApp development' },
  titus: { description: 'Nightly releases - chain state can be cleared at any time' },
};
const Testnets = _.keys(TestnetsDetails);
const DefaultTestnet = 'constantine';

const Prompts = {
  environment: {
    type: 'select',
    name: 'environment',
    message: 'Select the project environment',
    initial: _.indexOf(Environments, DefaultEnvironment),
    choices: _.map(EnvironmentsDetails, (details, name) => {
      return {
        title: _.capitalize(name),
        value: name,
        ...details
      };
    }),
    warn: 'This environment is unavailable for now'
  },
  testnet: {
    type: prev => (prev === 'testnet') ? 'select' : null,
    name: 'testnet',
    message: 'Select a testnet to use',
    initial: _.indexOf(Testnets, DefaultTestnet),
    choices: _.map(TestnetsDetails, (details, name) => {
      return {
        title: _.capitalize(name),
        value: name,
        ...details
      };
    }),
    warn: 'This network is unavailable for now'
  }
};

function loadNetworkConfig(environment, testnet = undefined) {
  const network = `${environment}${testnet ? `.${testnet}` : ''}`;
  return require(`./data/${network}.json`);
}

module.exports = {
  Environments,
  EnvironmentsDetails,
  Testnets,
  TestnetsDetails,
  Prompts,
  loadNetworkConfig
};
