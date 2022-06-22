const _ = require('lodash');

function isJson(str) {
  const json = _.attempt(JSON.parse, str);
  return !_.isError(json);
}

function isProjectName(name) {
  const regexp = new RegExp('^[a-z0-9-_]+$');
  return regexp.test(name);
}

function isArchwayAddress(address) {
  const regexp = new RegExp('^(archway)1([a-z0-9]+)$');
  return regexp.test(address);
}

module.exports = {
  isJson,
  isProjectName,
  isArchwayAddress
};
