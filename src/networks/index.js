const _ = require('lodash');

const EnvironmentsDetails = {
  testnet: { description: 'Testing networks for validators and dApp developers' },
  mainnet: { description: 'Production network', disabled: true },
  local: { description: 'Used for local development', disabled: true },
};
const Environments = _(EnvironmentsDetails)
  .omitBy(_.property('disabled'))
  .keys()
  .value();

const TestnetsDetails = {
  constantine: { description: 'Stable - recommended for dApp development' },
  titus: { description: 'Nightly releases - chain state can be cleared at any time' },
  torii: { description: 'Incentivized testnet' },
};
const Testnets = _.keys(TestnetsDetails);

function loadNetworkConfig(environment, testnet = undefined) {
  const network = `${environment}${testnet ? `.${testnet}` : ''}`;
  return require(`./data/${network}.json`);
}

module.exports = {
  Environments,
  EnvironmentsDetails,
  Testnets,
  TestnetsDetails,
  loadNetworkConfig
};
