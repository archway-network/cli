/* eslint-disable camelcase */
const _ = require('lodash');
const spawk = require('spawk');
const { ArchwayClient } = require('..');
const { TxCommands } = require('../tx');

const { arrayStartsWith } = require('../../../util/helpers');

const Fixtures = {
  txWasmStore: require('./fixtures/tx-wasm-store.json'),
  txWasmExecute: require('./fixtures/tx-wasm-execute.json'),
  txRewardsSetMetadata: require('./fixtures/tx-rewards-set-metadata.json'),
  queryRewardsEstimateFees: require('./fixtures/query-rewards-estimate-fees.json'),
  queryRewardsEstimateFeesWithPremium: require('./fixtures/query-rewards-estimate-fees-with-premium.json'),
  queryRewardsFlatFee: {
    denom: 'aarch',
    amount: '127999999747',
  },
};

const estimatedGasPrice = `${Fixtures.queryRewardsEstimateFees.gas_unit_price.amount}${Fixtures.queryRewardsEstimateFees.gas_unit_price.denom}`;

const defaultOptions = {
  from: 'alice',
  chainId: 'archway-1',
  node: 'https://rpc.archway.tech:443',
  gas: {
    mode: 'auto',
    prices: '900aarch',
    adjustment: 1.5,
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
        .stdout(JSON.stringify(Fixtures.queryRewardsEstimateFees));

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
          ['--gas-adjustment', defaultOptions.gas.adjustment],
          ['--gas-prices', estimatedGasPrice],
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
        .stdout(JSON.stringify(Fixtures.queryRewardsEstimateFees));

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
          ['--gas-adjustment', defaultOptions.gas.adjustment],
          ['--gas-prices', estimatedGasPrice],
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
        .stdout(JSON.stringify(Fixtures.queryRewardsEstimateFees));

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
          ['--gas-adjustment', defaultOptions.gas.adjustment],
          ['--gas-prices', estimatedGasPrice],
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
          ['--gas', 'auto'],
          ['--fees', '128aarch'],
          ['--output', 'json'],
        ].flat(),
        options: { stdio: ['inherit', 'pipe', 'pipe'] },
      });
    });
  });

  describe('execute', () => {
    test('checks for contract premium fees', async () => {
      const client = new ArchwayClient();
      const tx = new TxCommands(client);

      const gasEstimate = 164402;
      const contractAddress = 'archway1x2954lqw20h8hmhwy5ej598593kute9zg6ef0dmeyy5a2vdls6xqf8f5tu';

      const isTxWasmExecute = arrayStartsWith(['tx', 'wasm', 'execute', contractAddress]);

      spawk
        .spawn(client.command, args => isTxWasmExecute(args) && _.includes(args, '--dry-run'))
        .stderr(`gas estimate: ${gasEstimate}`);

      const adjustedGasEstimate = _.ceil(gasEstimate * defaultOptions.gas.adjustment);
      spawk
        .spawn(
          client.command,
          arrayStartsWith(['query', 'rewards', 'estimate-fees', adjustedGasEstimate, contractAddress])
        )
        .stdout(JSON.stringify(Fixtures.queryRewardsEstimateFeesWithPremium));

      const archwayd = spawk
        .spawn(client.command, isTxWasmExecute)
        .stderr(`gas estimate: ${adjustedGasEstimate}`)
        .stdout(JSON.stringify(Fixtures.txWasmExecute));

      const args = JSON.stringify({ increment: {} });
      const transaction = await tx.execute(contractAddress, args, defaultOptions);

      expect(transaction).toMatchObject(Fixtures.txWasmExecute);

      const { amount, denom } = Fixtures.queryRewardsEstimateFeesWithPremium.estimated_fee[0];
      expect(archwayd.calledWith).toMatchObject({
        args: [
          ['tx', 'wasm', 'execute', contractAddress, args],
          ['--from', defaultOptions.from],
          ['--chain-id', defaultOptions.chainId],
          ['--node', defaultOptions.node],
          ['--broadcast-mode', 'sync'],
          ['--gas', adjustedGasEstimate],
          ['--fees', `${amount}${denom}`],
          ['--output', 'json'],
        ].flat(),
        options: { stdio: ['inherit', 'pipe', 'pipe'] },
      });
    });
  });
});
