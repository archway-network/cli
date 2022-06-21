const spawk = require('spawk');
const ArchwayClient = require('..');
const QueryCommands = require('../query');

const Fixtures = {
  queryTxWasmStore: require('./fixtures/query-tx-wasm-store.json'),
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
  jest.clearAllMocks();
});

describe('QueryCommands', () => {
  describe('tx', () => {
    test('queries for a transaction hash', async () => {
      const client = new ArchwayClient();
      const query = new QueryCommands(client);

      const archwayd = spawk.spawn(client.command)
        .stdout(JSON.stringify(Fixtures.queryTxWasmStore));

      const txhash = Fixtures.queryTxWasmStore.txhash;
      const transaction = await query.tx(txhash, defaultOptions);

      expect(transaction).toMatchObject(Fixtures.queryTxWasmStore);

      expect(archwayd.calledWith).toMatchObject({
        args: [
          'query', 'tx', txhash,
          '--node', defaultOptions.node,
          '--output', 'json',
        ]
      });
    });
  });

  describe('txEventAttribute', () => {
    test('queries for a specific event attribute in a transaction', async () => {
      const client = new ArchwayClient();
      const query = new QueryCommands(client);

      const archwayd = spawk.spawn(client.command)
        .stdout(JSON.stringify(Fixtures.queryTxWasmStore));

      const txhash = Fixtures.queryTxWasmStore.txhash;
      const codeId = await query.txEventAttribute(txhash, 'store_code', 'code_id', defaultOptions);

      expect(codeId).toEqual('253');

      expect(archwayd.calledWith).toMatchObject({
        args: [
          'query', 'tx', txhash,
          '--node', defaultOptions.node,
          '--output', 'json',
        ]
      });
    });
  });

  describe('wasmCode', () => {
    test('downloads a wasm file by codeId from chain', async () => {
      const client = new ArchwayClient();
      const query = new QueryCommands(client);

      const outputFilePath = '/tmp/contract.wasm';
      const archwayd = spawk.spawn(client.command)
        .stdout(`Downloading wasm code to ${outputFilePath}`);

      const output = await query.wasmCode(1, outputFilePath, defaultOptions);

      expect(output).toEqual(`Downloading wasm code to ${outputFilePath}`);

      expect(archwayd.calledWith).toMatchObject({
        args: [
          'query', 'wasm', 'code', 1, outputFilePath,
          '--node', defaultOptions.node,
        ],
      });
    });
  });

  describe('smartContract', () => {
    test('queries a smart contract for a response', async () => {
      const client = new ArchwayClient();
      const query = new QueryCommands(client);

      const archwayd = spawk.spawn(client.command)
        .stdout(`Querying smart contract`);

      const output = await query.smartContract("contract-state","smart","archway1dfxl39mvqlufzsdf089u4ltlhns6scgun6vf5mkym7cy0zpsrausequkm4", "{'get_count': {}}", defaultOptions);
      console.log(output)
      expect(output);
      const args = "{'get_count': {}}"
      expect(archwayd.calledWith).toMatchObject({
        args: [
          'query', 'wasm', 'contract-state', 'smart', 'archway1dfxl39mvqlufzsdf089u4ltlhns6scgun6vf5mkym7cy0zpsrausequkm4', args,
          '--node', defaultOptions.node
        ],
      });
    });
  });
});
