const spawk = require('spawk');
const ArchwayClient = require('..');
const TxCommands = require('../tx');

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
  jest.resetAllMocks();
});

describe('TxCommands', () => {
  describe('wasm', () => {
    test('runs a wasm command', async () => {
      const client = new ArchwayClient();
      const tx = new TxCommands(client);

      const txhash = '8F3643DB9D50D7C97FD11CEB0030C2BE568A669CD072C34366C959C1C9D48C0D';
      const txOutput = {
        height: '0',
        txhash,
        codespace: '',
        code: 0,
        data: '',
        raw_log: '[]',
        logs: [],
        info: '',
        gas_wanted: '0',
        gas_used: '0',
        tx: null,
        timestamp: '',
        events: []
      };
      const archwayd = spawk.spawn(client.command)
        .stdout(`gas estimate: 1132045\n${JSON.stringify(txOutput)}`);

      const transaction = await tx.wasm('store', ['path/to/contract.wasm'], defaultOptions);

      expect(transaction).toMatchObject(txOutput);

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
