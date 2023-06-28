const _ = require('lodash');
const spawk = require('spawk');
const mockConsole = require('jest-mock-console');
const prompts = require('prompts');
const { ArchwayClient } = require('../../clients/archwayd');
const { Config } = require('../../util/config');
const Premium = require('../premium');

const Fixtures = {
  sampleConfig: require('./fixtures/sample-config.json'),
  txRewardsSetFlatFee: require('../../clients/archwayd/__tests__/fixtures/tx-rewards-set-flat-fee.json'),
  queryTxRewardsSetFlatFee: require('../../clients/archwayd/__tests__/fixtures/query-tx-rewards-set-flat-fee.json'),
};

jest.mock('ora');
jest.mock('prompts');
jest.mock('fs/promises');

const projectMetadata = {
  id: `${Fixtures.sampleConfig.name} 0.1.0`,
  name: Fixtures.sampleConfig.name,
  version: '0.1.0',
  wasm: {
    optimizedFilePath: `artifacts/${Fixtures.sampleConfig.name.replace(/-/g, '_')}.wasm`,
  },
};
const mockCargo = {
  projectMetadata: jest.fn().mockResolvedValue(projectMetadata),
};
jest.mock('../../clients/cargo', () => jest.fn(() => mockCargo));

const mockConfig = new Config(Fixtures.sampleConfig, '/tmp/config.json');
const findLastByTypeAndProjectAndChainId = _.bind(
  mockConfig.deployments.findLastByTypeAndProjectAndChainId,
  mockConfig.deployments
);

const aliceAddress = 'archway1ef8r7lwu6xtxkzhkmeufpcv7m3xy4gm5l2mazd';
const contractAddress = 'archway1yama69ck4d722lltrz64mf8q06u9r37y4kh5948cqpj49g0d5nlqvsuvse';

beforeEach(() => {
  mockConsole(['info', 'warn', 'error']);

  spawk.clean();
  spawk.preventUnmatched();

  jest.spyOn(Config, 'open').mockResolvedValue(mockConfig);

  jest.spyOn(prompts, 'override').mockImplementationOnce(prompts.mockResolvedValue);
});

afterEach(() => {
  spawk.done();
  jest.clearAllMocks();
});

describe('premium', () => {
  const client = createClient();

  beforeEach(() => {
    jest.spyOn(client.keys, 'getAddress').mockResolvedValue(aliceAddress);
    jest.spyOn(client.tx, 'setFlatFee').mockResolvedValue(Fixtures.txRewardsSetFlatFee);
    jest.spyOn(client.query, 'tx').mockResolvedValue(Fixtures.queryTxRewardsSetFlatFee);
  });

  test('set a flat fee for the last stored contract', async () => {
    jest.spyOn(client.query, 'txEventAttribute');
    jest.spyOn(mockConfig.deployments, 'add').mockImplementation(() => {});

    const flatFee = '1000aarch';
    await Premium(client, {
      from: 'alice',
      confirm: false,
      flatFee,
    });

    expect(client.tx.setFlatFee).toHaveBeenCalledWith(
      contractAddress,
      flatFee,
      expect.objectContaining({
        from: 'alice',
        chainId: 'titus-1',
        node: expect.anything(),
        flags: ['--yes'],
      })
    );
  });

  test('saves the premium for the contract', async () => {
    jest.spyOn(client.query, 'txEventAttribute');
    jest.spyOn(mockConfig.deployments, 'add');

    const flatFee = '1000aarch';
    await Premium(client, {
      from: 'alice',
      confirm: false,
      flatFee,
    });

    expect(mockConfig.deployments.add).toHaveBeenCalledWith({
      project: 'archway-increment',
      type: 'set-premium',
      chainId: 'titus-1',
      codeId: 253,
      txhash: Fixtures.txRewardsSetFlatFee.txhash,
      contract: contractAddress,
      flatFee: { denom: 'aarch', amount: '1000' },
    });
  });

  test('uses the contract address from the arguments', async () => {
    jest.spyOn(client.query, 'txEventAttribute');
    jest.spyOn(mockConfig.deployments, 'add').mockImplementation(() => {});

    jest
      .spyOn(mockConfig.deployments, 'findLastByTypeAndProjectAndChainId')
      .mockImplementation((type, projectName, chainId) =>
        type === 'instantiate' ? {} : findLastByTypeAndProjectAndChainId(type, projectName, chainId)
      );

    const flatFee = '1000aarch';
    await Premium(client, {
      from: 'alice',
      confirm: false,
      contract: contractAddress,
      flatFee,
    });

    expect(client.tx.setFlatFee).toHaveBeenCalledWith(
      contractAddress,
      flatFee,
      expect.objectContaining({
        from: 'alice',
        chainId: 'titus-1',
        node: expect.anything(),
        flags: ['--yes'],
      })
    );
  });
});

function createClient() {
  return new ArchwayClient({ extraArgs: ['--keyring-backend', 'test'] });
}
