const util = require('util');

async function ask(rl, query, defaultValue = null) {
  const question = util.promisify(rl.question).bind(rl);
  return await question(`${query} (default: ${defaultValue}): `) || defaultValue;
}

async function askBoolean(rl, query, defaultValue = 'N') {
  const answer = await ask(rl, `${query} [Y/N]`, defaultValue);
  return (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
}

async function askNumber(rl, query, defaultValue = null) {
  const answer = await ask(rl, query, defaultValue);
  return parseInt(answer);
}

module.exports = {
  ask,
  askBoolean,
  askNumber
};
