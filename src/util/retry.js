const retry = require('async-retry');
const ora = require('ora');
const chalk = require('chalk');

// eslint-disable-next-line no-unused-vars
const { ArchwayClient, TxExecutionError, assertValidTx } = require('../clients/archwayd');

const DefaultSpinnerText = 'Wait...';
const DefaultRetryOptions = {
  retries: 5,
  randomize: true,
  maxTimeout: 6 * 1000,
};

async function retryWrapper(fn, { text = DefaultSpinnerText, ...options } = {}) {
  const retryFn = retry(fn, {
    ...DefaultRetryOptions,
    ...options,
  });

  ora.promise(retryFn, { text });

  return await retryFn;
}

/**
 * Queries a tx hash and retries until the tx is confirmed.
 *
 * @param {ArchwayClient} archwayd
 * @param {Cargo} cargo
 * @param {object} options
 */
async function retryTx(archwayd, txhash, options) {
  return await retryWrapper(
    async bail => {
      try {
        const tx = await archwayd.query.tx(txhash, options);
        assertValidTx(tx);
      } catch (e) {
        if (e instanceof TxExecutionError) {
          bail(e);
        }
        throw e;
      }
    },
    { text: chalk`Waiting for tx {cyan ${txhash}} to confirm...` }
  );
}

module.exports = { retry: retryWrapper, retryTx };
