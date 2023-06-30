/* eslint-disable camelcase */
const spawk = require('spawk');
const { ArchwayClient } = require('..');
const { TxCommands } = require('../tx');

const { arrayStartsWith } = require('../../../util/helpers');

const Fixtures = {
  txWasmStore: require('./fixtures/tx-wasm-store.json'),
  txRewardsSetMetadata: require('./fixtures/tx-rewards-set-metadata.json'),
  queryEstimateFees: {
    gas_unit_price: {
      denom: 'aarch',
      amount: '900000000000.000000000000000000',
    },
    estimated_fee: [
      {
        denom: 'aarch',
        amount: '900000000000',
      },
    ],
  },
};

const estimatedGasPrice = `${Fixtures.queryEstimateFees.gas_unit_price.amount}${Fixtures.queryEstimateFees.gas_unit_price.denom}`;

const defaultOptions = {
  from: 'alice',
  chainId: 'archway-1',
  node: 'https://rpc.archway.tech:443',
  gas: {
    mode: 'auto',
    prices: '900aarch',
    adjustment: '1.5',
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

      spawk
        .spawn(client.command, arrayStartsWith(['query', 'rewards', 'estimate-fees']))
        .stdout(JSON.stringify(Fixtures.queryEstimateFees));

      const archwayd = spawk
        .spawn(client.command, arrayStartsWith(['tx', 'rewards', 'set-contract-metadata']))
        .stderr('gas estimate: 1132045')
        .stdout(`${JSON.stringify(Fixtures.txRewardsSetMetadata)}`);

      const contract = 'archway1x2954lqw20h8hmhwy5ej598593kute9zg6ef0dmeyy5a2vdls6xqf8f5tu';
      const ownerAddress = 'archway1ecak50zhujddqd639xw4ejghnyrrc6jlwnlgwt';
      const transaction = await tx.setContractMetadata(contract, { ownerAddress }, defaultOptions);

      expect(transaction).toMatchObject(Fixtures.txRewardsSetMetadata);

      expect(archwayd.calledWith).toMatchObject({
        args: [
          ['tx', 'rewards', 'set-contract-metadata', contract],
          ['--owner-address', ownerAddress],
          ['--from', defaultOptions.from],
          ['--chain-id', defaultOptions.chainId],
          ['--node', defaultOptions.node],
          ['--broadcast-mode', 'sync'],
          ['--gas', defaultOptions.gas.mode],
          ['--gas-prices', estimatedGasPrice],
          ['--gas-adjustment', defaultOptions.gas.adjustment],
          ['--output', 'json'],
        ].flat(),
        options: { stdio: ['inherit', 'pipe', 'pipe'] },
      });
    });

    test('can modify the rewards destination', async () => {
      const client = new ArchwayClient();
      const tx = new TxCommands(client);

      spawk
        .spawn(client.command, arrayStartsWith(['query', 'rewards', 'estimate-fees']))
        .stdout(JSON.stringify(Fixtures.queryEstimateFees));

      const archwayd = spawk
        .spawn(client.command, arrayStartsWith(['tx', 'rewards', 'set-contract-metadata']))
        .stderr('gas estimate: 1132045')
        .stdout(`${JSON.stringify(Fixtures.txRewardsSetMetadata)}`);

      const contract = 'archway1x2954lqw20h8hmhwy5ej598593kute9zg6ef0dmeyy5a2vdls6xqf8f5tu';
      const rewardsAddress = 'archway1ecak50zhujddqd639xw4ejghnyrrc6jlwnlgwt';
      const transaction = await tx.setContractMetadata(contract, { rewardsAddress }, defaultOptions);

      expect(transaction).toMatchObject(Fixtures.txRewardsSetMetadata);

      expect(archwayd.calledWith).toMatchObject({
        args: [
          ['tx', 'rewards', 'set-contract-metadata', contract],
          ['--rewards-address', rewardsAddress],
          ['--from', defaultOptions.from],
          ['--chain-id', defaultOptions.chainId],
          ['--node', defaultOptions.node],
          ['--broadcast-mode', 'sync'],
          ['--gas', defaultOptions.gas.mode],
          ['--gas-prices', estimatedGasPrice],
          ['--gas-adjustment', defaultOptions.gas.adjustment],
          ['--output', 'json'],
        ].flat(),
        options: { stdio: ['inherit', 'pipe', 'pipe'] },
      });
    });
  });

  describe('wasm', () => {
    test('runs a wasm command', async () => {
      const client = new ArchwayClient();
      const tx = new TxCommands(client);

      spawk
        .spawn(client.command, arrayStartsWith(['query', 'rewards', 'estimate-fees']))
        .stdout(JSON.stringify(Fixtures.queryEstimateFees));

      const archwayd = spawk
        .spawn(client.command, arrayStartsWith(['tx', 'wasm', 'store']))
        .stderr('gas estimate: 1132045')
        .stdout(JSON.stringify(Fixtures.txWasmStore));

      const transaction = await tx.store('path/to/contract.wasm', defaultOptions);

      expect(transaction).toMatchObject(Fixtures.txWasmStore);

      expect(archwayd.calledWith).toMatchObject({
        args: [
          ['tx', 'wasm', 'store', 'path/to/contract.wasm'],
          ['--from', defaultOptions.from],
          ['--chain-id', defaultOptions.chainId],
          ['--node', defaultOptions.node],
          ['--broadcast-mode', 'sync'],
          ['--gas', defaultOptions.gas.mode],
          ['--gas-prices', estimatedGasPrice],
          ['--gas-adjustment', defaultOptions.gas.adjustment],
          ['--output', 'json'],
        ].flat(),
        options: { stdio: ['inherit', 'pipe', 'pipe'] },
      });
    });

    test('can set fixed fees', async () => {
      const client = new ArchwayClient();
      const tx = new TxCommands(client);

      const archwayd = spawk
        .spawn(client.command, arrayStartsWith(['tx', 'wasm', 'store']))
        .stderr('gas estimate: 1132045')
        .stdout(JSON.stringify(Fixtures.txWasmStore));

      const transaction = await tx.store('path/to/contract.wasm', { ...defaultOptions, fees: '128aarch' });

      expect(transaction).toMatchObject(Fixtures.txWasmStore);

      expect(archwayd.calledWith).toMatchObject({
        args: [
          ['tx', 'wasm', 'store', 'path/to/contract.wasm'],
          ['--from', defaultOptions.from],
          ['--chain-id', defaultOptions.chainId],
          ['--node', defaultOptions.node],
          ['--broadcast-mode', 'sync'],
          ['--fees', '128aarch'],
          ['--output', 'json'],
        ].flat(),
        options: { stdio: ['inherit', 'pipe', 'pipe'] },
      });
    });
  });
});
