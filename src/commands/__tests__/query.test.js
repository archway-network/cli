const spawk = require('spawk');
const mockConsole = require('jest-mock-console');
const prompts = require('prompts');
const ArchwayClient = require('../../clients/archwayd');
const { Config } = require('../../util/config');
const Query = require('../query');

const Fixtures = {
  sampleConfig: require('./fixtures/sample-config.json'),
};

const defaultOptions = {
  node: 'https://rpc.titus-1.archway.tech:443',
  printStdout: false
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

jest.mock('../../clients/cargo', () => jest.fn(() => mockCargo));

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
    jest.spyOn(client.query, 'txEventAttribute');
    jest.spyOn(mockConfig.deployments, 'add')
      .mockImplementation(() => { });
    const archwayd = spawk.spawn(client.command)
      .stdout(`Querying smart contract`);
    await Query(client, {
      module: "contract-state",
      type: "smart",
      options: {
        args: '{"get_count":{}}',
      }
    },);
    const queryArgs =
      '{"get_count":{}}';
    expect(archwayd.calledWith).toMatchObject({
      args: [
        'query', 'wasm', 'contract-state', 'smart', 'archway1yama69ck4d722lltrz64mf8q06u9r37y4kh5948cqpj49g0d5nlqvsuvse', queryArgs,
        '--node', defaultOptions.node
      ],
    });
  });
});
function createClient() {
  return new ArchwayClient({ });
}
