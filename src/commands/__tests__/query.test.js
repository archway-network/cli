const spawk = require('spawk');
const mockConsole = require('jest-mock-console');
const prompts = require('prompts');
const ArchwayClient = require('../../clients/archwayd');
const { Config } = require('../../util/config');
const Query = require('../query');

const Fixtures = {
  sampleConfig: require('./fixtures/sample-config.json'),
  txWasmInstantiate: require('../../clients/archwayd/__test__/fixtures/tx-wasm-instantiate.json'),
  queryTxWasmInstantiate: require('../../clients/archwayd/__test__/fixtures/query-tx-wasm-instantiate.json'),
};

jest.mock('ora');
jest.mock('prompts');
jest.mock('fs/promises');

const projectMetadata = {
  id: `${Fixtures.sampleConfig.name} 0.1.0`,
  name: Fixtures.sampleConfig.name,
  version: '0.1.0',
  wasm: {
    optimizedFilePath: `artifacts/${Fixtures.sampleConfig.name.replace(/-/g, '_')}.wasm`
  }
};
const mockCargo = {
  projectMetadata: jest.fn().mockResolvedValue(projectMetadata),
};
jest.mock('../../clients/cargo', () => {
  return jest.fn(() => mockCargo);
});

const mockConfig = new Config(Fixtures.sampleConfig, '/tmp/config.json');

const aliceAddress = 'archway1u4rmd5z78smu0tmtw45mran0pz4umzvxaf3g56';
const contractAddress = 'archway14v952t75xgnufzlrft52ekltt8nsu9gxqh4xz55qfm6wqslc0spqspc5lm';



describe('query', () => {
  const client = createClient();

  beforeEach(() => {
    jest.spyOn(client.keys, 'getAddress')
      .mockResolvedValue(aliceAddress);
    jest.spyOn(client.tx, 'wasm')
      .mockResolvedValue(Fixtures.txWasmInstantiate);
    jest.spyOn(client.query, 'tx')
      .mockResolvedValue(Fixtures.queryTxWasmInstantiate);
  });

  test('queries last stored contract', async () => {
    jest.spyOn(client.query, 'txEventAttribute')
    jest.spyOn(mockConfig.deployments, 'add')
      .mockImplementation(() => { });

    await Query(client, {
      module: 'contract-state',
      type: 'smart',
      options: {
        contract: contractAddress,
        args: '{"get_count":{}}',
        chainId: 'titus-1'
      },
    });

    const queryArgs = [
      "{'get_count':{}}"
    ];
    expect(client.query.smartContract).toHaveBeenCalledWith(
      'wasm',
      queryArgs,
      expect.objectContaining({
        from: 'alice',
        chainId: 'titus-1',
        node: expect.anything(),
        flags: ['--yes']
      })
    );
  });

  
});

function createClient() {
  return new ArchwayClient({ extraArgs: ['--keyring-backend', 'test'] });
}
