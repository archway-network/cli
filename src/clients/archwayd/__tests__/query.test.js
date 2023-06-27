const spawk = require('spawk');
const { ArchwayClient } = require('..');
const QueryCommands = require('../query');

const Fixtures = {
  queryRewardsEstimateFees: require('./fixtures/query-rewards-estimate-fees.json'),
  queryTxWasmStore: require('./fixtures/query-tx-wasm-store.json'),
};

const defaultOptions = {
  node: 'https://rpc.titus.archway.tech:443',
  printOutput: false,
};

beforeEach(() => {
  spawk.clean();
  spawk.preventUnmatched();
});

afterEach(() => {
  spawk.done();
  jest.clearAllMocks();
});

describe('QueryCommands', () => {
  describe('tx', () => {
    test('queries for a transaction hash', async () => {
      const client = new ArchwayClient();
      const query = new QueryCommands(client);

      const archwayd = spawk.spawn(client.command).stdout(JSON.stringify(Fixtures.queryTxWasmStore));

      const txhash = Fixtures.queryTxWasmStore.txhash;
      const transaction = await query.tx(txhash, defaultOptions);

      expect(transaction).toMatchObject(Fixtures.queryTxWasmStore);

      expect(archwayd.calledWith).toMatchObject({
        args: ['query', 'tx', txhash, '--node', defaultOptions.node, '--output', 'json'],
      });
    });
  });

  describe('txEventAttribute', () => {
    test('queries for a specific event attribute in a transaction', async () => {
      const client = new ArchwayClient();
      const query = new QueryCommands(client);

      const archwayd = spawk.spawn(client.command).stdout(JSON.stringify(Fixtures.queryTxWasmStore));

      const txhash = Fixtures.queryTxWasmStore.txhash;
      const codeId = await query.txEventAttribute(txhash, 'store_code', 'code_id', defaultOptions);

      expect(codeId).toEqual('253');

      expect(archwayd.calledWith).toMatchObject({
        args: ['query', 'tx', txhash, '--node', defaultOptions.node, '--output', 'json'],
      });
    });
  });

  describe('wasmCode', () => {
    test('downloads a wasm file by codeId from chain', async () => {
      const client = new ArchwayClient();
      const query = new QueryCommands(client);

      const outputFilePath = '/tmp/contract.wasm';
      const archwayd = spawk.spawn(client.command).stdout(`Downloading wasm code to ${outputFilePath}`);

      const output = await query.wasmCode(1, outputFilePath, defaultOptions);

      expect(output).toEqual(`Downloading wasm code to ${outputFilePath}`);

      expect(archwayd.calledWith).toMatchObject({
        args: ['query', 'wasm', 'code', 1, outputFilePath, '--node', defaultOptions.node],
      });
    });
  });

  describe('smartContract', () => {
    test('queries a smart contract for a response', async () => {
      const client = new ArchwayClient();
      const query = new QueryCommands(client);

      let queryResult = { count: 0 };

      const archwayd = spawk.spawn(client.command).stdout(JSON.stringify(queryResult));

      const contract = 'archway1dfxl39mvqlufzsdf089u4ltlhns6scgun6vf5mkym7cy0zpsrausequkm4';

      const args = '{ "get_count": {} }';
      const output = await query.smartContract('contract-state', 'smart', contract, args, defaultOptions);
      expect(output).toEqual(queryResult);

      expect(archwayd.calledWith).toMatchObject({
        args: [
          'query',
          'wasm',
          'contract-state',
          'smart',
          contract,
          args,
          '--node',
          defaultOptions.node,
          '--output',
          'json',
        ],
      });
    });
  });

  describe('rewardsEstimateFees', () => {
    test('queries the current minimum gas fee for the chain', async () => {
      const client = new ArchwayClient();
      const query = new QueryCommands(client);

      const archwayd = spawk.spawn(client.command).stdout(JSON.stringify(Fixtures.queryRewardsEstimateFees));

      const output = await query.rewardsEstimateFees(13, defaultOptions);
      expect(output).toEqual('128.06592utitus');

      expect(archwayd.calledWith).toMatchObject({
        args: ['query', 'rewards', 'estimate-fees', 13, '--node', defaultOptions.node, '--output', 'json'],
      });
    });
  });
});
