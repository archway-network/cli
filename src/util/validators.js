const _ = require('lodash');

/**
 * Validates if the value is a JSON.
 *
 * @param {string} value
 *
 * @returns boolean
 */
function isJson(value) {
  const json = _.attempt(JSON.parse, value);
  return !_.isError(json);
}

/**
 * Validates if the value is an accepted project name.
 *
 * @param {string} value
 *
 * @returns boolean
 */
function isProjectName(value) {
  return /^[a-z0-9-_]+$/.test(value);
}

/**
 * Validates if the value is an Archway bech32 address.
 *
 * @param {string} value
 *
 * @returns boolean
 */
function isArchwayAddress(value) {
  return /^(archway)1([a-z0-9]+)$/.test(value);
}

/**
 * Validates if the value is a coin.
 *
 * @param {string} value
 * @param {string} denom
 *
 * @returns boolean
 */
function isCoin(value, denom = undefined) {
  const regexp = /^([0-9]+)([a-z]+)$/;
  return regexp.test(value) && (_.isEmpty(denom) || value.match(regexp)?.at(2) === denom);
}

module.exports = {
  isJson,
  isProjectName,
  isArchwayAddress,
  isCoin,
};
