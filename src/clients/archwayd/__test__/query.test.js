const spawk = require('spawk');
const ArchwayClient = require('..');
const QueryCommands = require('../query');

const Fixtures = {
  tx: {
    wasmStore: require('./fixtures/query-tx-wasm-store.json'),
  }
};

const defaultOptions = {
  node: 'https://rpc.titus.archway.tech:443',
  printStdout: false
};

beforeEach(() => {
  spawk.clean();
  spawk.preventUnmatched();
});

afterEach(() => {
  spawk.done();
  jest.resetAllMocks();
});

describe('QueryCommands', () => {
  describe('tx', () => {
    test('queries for a transaction hash', async () => {
      const client = new ArchwayClient();
      const query = new QueryCommands(client);

      const archwayd = spawk.spawn(client.command)
        .stdout(JSON.stringify(Fixtures.tx.wasmStore));

      const txhash = Fixtures.tx.wasmStore.txhash;
      const transaction = await query.tx(txhash, defaultOptions);

      expect(transaction).toMatchObject(Fixtures.tx.wasmStore);

      expect(archwayd.calledWith).toMatchObject({
        args: [
          'query', 'tx', txhash,
          '--node', defaultOptions.node,
          '--output', 'json',
        ],
        options: { maxBuffer: 1024 * 1024 }
      });
    });
  });

  describe('txEventAttribute', () => {
    test('queries for a specific event attribute in a transaction', async () => {
      const client = new ArchwayClient();
      const query = new QueryCommands(client);

      const archwayd = spawk.spawn(client.command)
        .stdout(JSON.stringify(Fixtures.tx.wasmStore));

      const txhash = Fixtures.tx.wasmStore.txhash;
      const codeId = await query.txEventAttribute(txhash, 'store_code', 'code_id', defaultOptions);

      expect(codeId).toEqual('253');

      expect(archwayd.calledWith).toMatchObject({
        args: [
          'query', 'tx', txhash,
          '--node', defaultOptions.node,
          '--output', 'json',
        ],
        options: { maxBuffer: 1024 * 1024 }
      });
    });
  });
});
