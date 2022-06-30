const spawk = require('spawk');
const mockConsole = require('jest-mock-console');
const prompts = require('prompts');
const ArchwayClient = require('../../clients/archwayd');
const { Config } = require('../../util/config');
const Query = require('../query');

const Fixtures = {
  sampleConfig: require('./fixtures/sample-config.json'),
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

describe('query', () => {
  const client = createClient();
  beforeEach(() => {
    mockConsole(['info', 'warn', 'error']);
    spawk.clean();
    spawk.preventUnmatched();
    jest.spyOn(Config, 'open')
      .mockResolvedValue(mockConfig);
    jest.spyOn(prompts, 'override')
      .mockImplementationOnce(prompts.mockResolvedValue);
  });
  afterEach(() => {
    spawk.done();
    jest.clearAllMocks();
  });

  test('queries last stored contract', async () => {
    jest.spyOn(client.query, 'txEventAttribute')
    jest.spyOn(mockConfig.deployments, 'add')
      .mockImplementation(() => { });
    const contractAddress = 'archway14v952t75xgnufzlrft52ekltt8nsu9gxqh4xz55qfm6wqslc0spqspc5lm';
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
  return new ArchwayClient({ });
}
