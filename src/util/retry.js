const retry = require('async-retry');
const ora = require('ora');

const DefaultSpinnerText = 'Wait...';
const DefaultRetryOptions = {
  retries: 5,
  randomize: true,
  maxTimeout: 6 * 1000,
};

async function retryWrapper(fn, { text = DefaultSpinnerText, ...options } = {}) {
  const retryFn = retry(fn, {
    ...DefaultRetryOptions,
    ...options
  });

  ora.promise(retryFn, { text });

  return await retryFn;
}

module.exports = retryWrapper;
