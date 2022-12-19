// archway-cli/util/index.js

const Accounts = require('./accounts');
const Build = require('./build');
const Configure = require('./configure');
const Deploy = require('./deploy');
const DeployHistory = require('./deployments');
const Instantiate = require('./instantiate');
const Metadata = require('./metadata.js');
const Network = require('./network');
const New = require('./new');
const Query = require('./query');
const Store = require('./store');
const Test = require('./test');
const Tx = require('./tx');

module.exports = {
  Accounts,
  Build,
  Configure,
  Deploy,
  DeployHistory,
  Instantiate,
  Metadata,
  Network,
  New,
  Query,
  Store,
  Test,
  Tx
};
