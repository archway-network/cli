const _ = require('lodash');

function arrayStartsWith(other) {
  other = _.castArray(other);
  return array => _.chain(array).take(other.length).isEqual(other).value();
}

module.exports = {
  arrayStartsWith,
};
