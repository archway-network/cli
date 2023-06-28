const spawk = require('spawk');
const { ArchwayClient } = require('..');
const { TxCommands } = require('../tx');

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

describe('TxCommands', () => {
  describe('setContractMetadata', () => {
    test('can modify the contract owner', async () => {
      const client = new ArchwayClient();
      const tx = new TxCommands(client);

      jest.spyOn(client.query, 'rewardsEstimateFees').mockResolvedValue('128utitus');

      const archwayd = spawk
        .spawn(client.command)
        .stdout(`gas estimate: 1132045\n${JSON.stringify(Fixtures.txWasmStore)}`);

      const contract = 'archway1x2954lqw20h8hmhwy5ej598593kute9zg6ef0dmeyy5a2vdls6xqf8f5tu';
      const ownerAddress = 'archway1ecak50zhujddqd639xw4ejghnyrrc6jlwnlgwt';
      const transaction = await tx.setContractMetadata(contract, { ownerAddress }, defaultOptions);

      expect(transaction).toMatchObject(Fixtures.txWasmStore);

      expect(archwayd.calledWith).toMatchObject({
        args: [
          'tx',
          'rewards',
          'set-contract-metadata',
          contract,
          '--owner-address',
          ownerAddress,
          '--from',
          defaultOptions.from,
          '--chain-id',
          defaultOptions.chainId,
          '--node',
          defaultOptions.node,
          '--broadcast-mode',
          'sync',
          '--gas',
          defaultOptions.gas.mode,
          '--gas-prices',
          '128utitus',
          '--gas-adjustment',
          defaultOptions.gas.adjustment,
          '--output',
          'json',
        ],
        options: { stdio: ['inherit', 'pipe', 'pipe'] },
      });
    });

    test('can modify the rewards destination', async () => {
      const client = new ArchwayClient();
      const tx = new TxCommands(client);

      jest.spyOn(client.query, 'rewardsEstimateFees').mockResolvedValue('128utitus');

      const archwayd = spawk
        .spawn(client.command)
        .stdout(`gas estimate: 1132045\n${JSON.stringify(Fixtures.txWasmStore)}`);

      const contract = 'archway1x2954lqw20h8hmhwy5ej598593kute9zg6ef0dmeyy5a2vdls6xqf8f5tu';
      const rewardsAddress = 'archway1ecak50zhujddqd639xw4ejghnyrrc6jlwnlgwt';
      const transaction = await tx.setContractMetadata(contract, { rewardsAddress }, defaultOptions);

      expect(transaction).toMatchObject(Fixtures.txWasmStore);

      expect(archwayd.calledWith).toMatchObject({
        args: [
          'tx',
          'rewards',
          'set-contract-metadata',
          contract,
          '--rewards-address',
          rewardsAddress,
          '--from',
          defaultOptions.from,
          '--chain-id',
          defaultOptions.chainId,
          '--node',
          defaultOptions.node,
          '--broadcast-mode',
          'sync',
          '--gas',
          defaultOptions.gas.mode,
          '--gas-prices',
          '128utitus',
          '--gas-adjustment',
          defaultOptions.gas.adjustment,
          '--output',
          'json',
        ],
        options: { stdio: ['inherit', 'pipe', 'pipe'] },
      });
    });
  });

  describe('wasm', () => {
    test('runs a wasm command', async () => {
      const client = new ArchwayClient();
      const tx = new TxCommands(client);

      jest.spyOn(client.query, 'rewardsEstimateFees').mockResolvedValue('128utitus');

      const archwayd = spawk
        .spawn(client.command)
        .stdout(`gas estimate: 1132045\n${JSON.stringify(Fixtures.txWasmStore)}`);

      const transaction = await tx.wasm('store', ['path/to/contract.wasm'], defaultOptions);

      expect(transaction).toMatchObject(Fixtures.txWasmStore);

      expect(archwayd.calledWith).toMatchObject({
        args: [
          'tx',
          'wasm',
          'store',
          'path/to/contract.wasm',
          '--from',
          defaultOptions.from,
          '--chain-id',
          defaultOptions.chainId,
          '--node',
          defaultOptions.node,
          '--broadcast-mode',
          'sync',
          '--gas',
          defaultOptions.gas.mode,
          '--gas-prices',
          '128utitus',
          '--gas-adjustment',
          defaultOptions.gas.adjustment,
          '--output',
          'json',
        ],
        options: { stdio: ['inherit', 'pipe', 'pipe'] },
      });
    });
  });
});
