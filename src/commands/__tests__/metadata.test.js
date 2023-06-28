const _ = require('lodash');
const spawk = require('spawk');
const mockConsole = require('jest-mock-console');
const prompts = require('prompts');
const { ArchwayClient } = require('../../clients/archwayd');
const { Config } = require('../../util/config');
const Metadata = require('../metadata');

const Fixtures = {
  sampleConfig: require('./fixtures/sample-config.json'),
  txRewardsSetMetadata: require('../../clients/archwayd/__tests__/fixtures/tx-rewards-set-metadata.json'),
  queryTxRewardsSetMetadata: require('../../clients/archwayd/__tests__/fixtures/query-tx-rewards-set-metadata.json'),
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
const bobAddress = 'archway1sgnl48q4df0y3cv2m42c9nq6wvmv25vauvreem';
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

describe('metadata', () => {
  const client = createClient();

  beforeEach(() => {
    jest.spyOn(client.keys, 'getAddress').mockResolvedValue(aliceAddress);
    jest.spyOn(client.tx, 'setContractMetadata').mockResolvedValue(Fixtures.txRewardsSetMetadata);
    jest.spyOn(client.query, 'tx').mockResolvedValue(Fixtures.queryTxRewardsSetMetadata);
  });

  test('set the metadata for the last stored contract', async () => {
    jest.spyOn(client.query, 'txEventAttribute');
    jest.spyOn(mockConfig.deployments, 'add').mockImplementation(() => {});

    const contractMetadata = { ownerAddress: aliceAddress, rewardsAddress: aliceAddress };
    await Metadata(client, {
      from: 'alice',
      confirm: false,
      ...contractMetadata,
    });

    expect(client.tx.setContractMetadata).toHaveBeenCalledWith(
      contractAddress,
      contractMetadata,
      expect.objectContaining({
        from: 'alice',
        chainId: 'titus-1',
        node: expect.anything(),
        flags: ['--yes'],
      })
    );
  });

  test('saves the metadata for the contract', async () => {
    jest.spyOn(client.query, 'txEventAttribute');
    jest.spyOn(mockConfig.deployments, 'add');

    const contractMetadata = { ownerAddress: aliceAddress, rewardsAddress: aliceAddress };
    await Metadata(client, {
      from: 'alice',
      confirm: false,
      ...contractMetadata,
    });

    expect(mockConfig.deployments.add).toHaveBeenCalledWith({
      project: 'archway-increment',
      type: 'set-metadata',
      chainId: 'titus-1',
      codeId: 253,
      txhash: Fixtures.txRewardsSetMetadata.txhash,
      contract: contractAddress,
      contractMetadata,
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

    const contractMetadata = { ownerAddress: aliceAddress, rewardsAddress: aliceAddress };
    await Metadata(client, {
      from: 'alice',
      confirm: false,
      contract: contractAddress,
      ...contractMetadata,
    });

    expect(client.tx.setContractMetadata).toHaveBeenCalledWith(
      contractAddress,
      contractMetadata,
      expect.objectContaining({
        from: 'alice',
        chainId: 'titus-1',
        node: expect.anything(),
        flags: ['--yes'],
      })
    );
  });

  test('uses the owner address from the arguments', async () => {
    jest.spyOn(client.query, 'txEventAttribute');
    jest.spyOn(mockConfig.deployments, 'add').mockImplementation(() => {});

    jest
      .spyOn(mockConfig.deployments, 'findLastByTypeAndProjectAndChainId')
      .mockImplementation((type, projectName, chainId) =>
        type === 'set-metadata'
          ? { contractMetadata: { rewardsAddress: aliceAddress } }
          : findLastByTypeAndProjectAndChainId(type, projectName, chainId)
      );

    await Metadata(client, {
      from: 'alice',
      confirm: false,
      ownerAddress: bobAddress,
    });

    expect(client.tx.setContractMetadata).toHaveBeenCalledWith(
      contractAddress,
      { ownerAddress: bobAddress },
      expect.objectContaining({
        from: 'alice',
        chainId: 'titus-1',
        node: expect.anything(),
        flags: ['--yes'],
      })
    );
  });

  test('uses the rewards address from the arguments', async () => {
    jest.spyOn(client.query, 'txEventAttribute');
    jest.spyOn(mockConfig.deployments, 'add').mockImplementation(() => {});

    jest
      .spyOn(mockConfig.deployments, 'findLastByTypeAndProjectAndChainId')
      .mockImplementation((type, projectName, chainId) =>
        type === 'set-metadata'
          ? { contractMetadata: { ownerAddress: aliceAddress } }
          : findLastByTypeAndProjectAndChainId(type, projectName, chainId)
      );

    await Metadata(client, {
      from: 'alice',
      confirm: false,
      rewardsAddress: bobAddress,
    });

    expect(client.tx.setContractMetadata).toHaveBeenCalledWith(
      contractAddress,
      { rewardsAddress: bobAddress },
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
