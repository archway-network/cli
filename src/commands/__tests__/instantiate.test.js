const spawk = require('spawk');
const mockConsole = require('jest-mock-console');
const prompts = require('prompts');
const ArchwayClient = require('../../clients/archwayd');
const { Config } = require('../../util/config');
const Instantiate = require('../instantiate');

const Fixtures = {
  sampleConfig: require('./fixtures/sample-config.json'),
  txWasmInstantiate: require('../../clients/archwayd/__tests__/fixtures/tx-wasm-instantiate.json'),
  queryTxWasmInstantiate: require('../../clients/archwayd/__tests__/fixtures/query-tx-wasm-instantiate.json'),
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

const aliceAddress = 'archway1u4rmd5z78smu0tmtw45mran0pz4umzvxaf3g56';
const contractAddress = 'archway14v952t75xgnufzlrft52ekltt8nsu9gxqh4xz55qfm6wqslc0spqspc5lm';

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

describe('instantiate', () => {
  const client = createClient();

  beforeEach(() => {
    jest.spyOn(client.keys, 'getAddress')
      .mockResolvedValue(aliceAddress);
    jest.spyOn(client.tx, 'wasm')
      .mockResolvedValue(Fixtures.txWasmInstantiate);
    jest.spyOn(client.query, 'tx')
      .mockResolvedValue(Fixtures.queryTxWasmInstantiate);
  });

  test('instantiates last stored contract', async () => {
    jest.spyOn(client.query, 'txEventAttribute');
    jest.spyOn(mockConfig.deployments, 'add')
      .mockImplementation(() => { });

    await Instantiate(client, {
      from: 'alice',
      confirm: false,
      label: 'test 0.1.0',
      args: '{ "count": 0 }',
    });

    const instantiateArgs = [
      253,
      '{ "count": 0 }',
      '--label', 'test 0.1.0',
      '--admin', aliceAddress
    ];
    expect(client.tx.wasm).toHaveBeenCalledWith(
      'instantiate',
      instantiateArgs,
      expect.objectContaining({
        from: 'alice',
        chainId: 'titus-1',
        node: expect.anything(),
        flags: ['--yes']
      })
    );
  });

  test('saves the instantiated contract address', async () => {
    jest.spyOn(client.query, 'txEventAttribute');
    jest.spyOn(mockConfig.deployments, 'add');

    await Instantiate(client, {
      from: 'alice',
      confirm: false,
      label: 'test 0.1.0',
      args: '{ "count": 0 }',
    });

    expect(client.query.txEventAttribute).toHaveBeenCalledWith(
      Fixtures.txWasmInstantiate.txhash,
      'instantiate',
      '_contract_address',
      expect.objectContaining({
        node: expect.anything()
      })
    );

    expect(mockConfig.deployments.add).toHaveBeenCalledWith({
      project: 'archway-increment',
      type: 'instantiate',
      chainId: 'titus-1',
      codeId: 253,
      txhash: Fixtures.txWasmInstantiate.txhash,
      address: contractAddress,
      admin: aliceAddress
    });
  });

  test('uses the code ID from the arguments', async () => {
    jest.spyOn(client.query, 'txEventAttribute');
    jest.spyOn(mockConfig.deployments, 'add')
      .mockImplementation(() => { });

    await Instantiate(client, {
      from: 'alice',
      confirm: false,
      label: 'test 0.1.0',
      args: '{ "count": 0 }',
      codeId: 111
    });

    const instantiateArgs = [
      111,
      '{ "count": 0 }',
      '--label', 'test 0.1.0',
      '--admin', aliceAddress
    ];
    expect(client.tx.wasm).toHaveBeenCalledWith(
      'instantiate',
      instantiateArgs,
      expect.objectContaining({
        from: 'alice',
        chainId: 'titus-1',
        node: expect.anything(),
        flags: ['--yes']
      })
    );
  });

  test('uses the admin address from the arguments', async () => {
    jest.spyOn(client.query, 'txEventAttribute');
    jest.spyOn(mockConfig.deployments, 'add')
      .mockImplementation(() => { });

    const bobAddress = 'archway1sgnl48q4df0y3cv2m42c9nq6wvmv25vauvreem';
    await Instantiate(client, {
      from: 'alice',
      confirm: false,
      label: 'test 0.1.0',
      args: '{ "count": 0 }',
      adminAddress: bobAddress
    });

    const instantiateArgs = [
      253,
      '{ "count": 0 }',
      '--label', 'test 0.1.0',
      '--admin', bobAddress
    ];
    expect(client.tx.wasm).toHaveBeenCalledWith(
      'instantiate',
      instantiateArgs,
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
