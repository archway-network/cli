// archway-cli/util/index.js

const Accounts = require('./accounts');
const Build = require('./build');
const Configure = require('./configure');
const Deploy = require('./deploy');
const Network = require('./network');
const New = require('./new');
const Query = require('./query');
const Test = require('./test');
const Tx = require('./tx');

module.exports = {
  Accounts: Accounts,
  Build: Build,
  Configure: Configure,
  Deploy: Deploy,
  Network: Network,
  New: New,
  Query: Query,
  Test: Test,
  Tx: Tx
};