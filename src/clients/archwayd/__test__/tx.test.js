const spawk = require('spawk');
const ArchwayClient = require('..');
const TxCommands = require('../tx');

const Fixtures = {
  txWasmStore: require('./fixtures/tx-wasm-store.json'),
};

const defaultOptions = {
  from: 'alice',
  chainId: 'titus-1',
  node: 'https://rpc.titus.archway.tech:443',
  gas: {
    mode: 'auto',
    prices: '0.002utitus',
    adjustment: '1.2',
  },
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

describe('TxCommands', () => {
  describe('wasm', () => {
    test('runs a wasm command', async () => {
      const client = new ArchwayClient();
      const tx = new TxCommands(client);

      const archwayd = spawk.spawn(client.command)
        .stdout(`gas estimate: 1132045\n${JSON.stringify(Fixtures.txWasmStore)}`);

      const transaction = await tx.wasm('store', ['path/to/contract.wasm'], defaultOptions);

      expect(transaction).toMatchObject(Fixtures.txWasmStore);

      expect(archwayd.calledWith).toMatchObject({
        args: [
          'tx', 'wasm', 'store', 'path/to/contract.wasm',
          '--gas', defaultOptions.gas.mode,
          '--gas-prices', defaultOptions.gas.prices,
          '--gas-adjustment', defaultOptions.gas.adjustment,
          '--from', defaultOptions.from,
          '--chain-id', defaultOptions.chainId,
          '--node', defaultOptions.node,
          '--broadcast-mode', 'sync',
          '--output', 'json',
        ],
        options: { stdio: ['inherit', 'pipe', 'inherit'] }
      });
    });
  });
});
