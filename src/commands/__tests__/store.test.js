const spawk = require('spawk');
const mockConsole = require('jest-mock-console');
const { readFile } = require('fs/promises');
const prompts = require('prompts');
const ArchwayClient = require('../../clients/archwayd');
const { Config } = require('../../util/config');
const Store = require('../store');

const Fixtures = {
  sampleConfig: require('./fixtures/sample-config.json'),
  txWasmStore: require('../../clients/archwayd/__tests__/fixtures/tx-wasm-store.json'),
  queryTxWasmStore: require('../../clients/archwayd/__tests__/fixtures/query-tx-wasm-store.json'),
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

describe('store', () => {
  const client = createClient();

  beforeEach(() => {
    jest.spyOn(client.tx, 'wasm')
      .mockResolvedValue(Fixtures.txWasmStore);
    jest.spyOn(client.query, 'tx')
      .mockResolvedValue(Fixtures.queryTxWasmStore);
  });

  test('stores the wasm on-chain', async () => {
    jest.spyOn(client.query, 'txEventAttribute');
    jest.spyOn(mockConfig.deployments, 'add');

    jest.spyOn(client.query, 'wasmCode')
      .mockRejectedValue('should not happen');

    await Store(client, { verify: false, from: 'alice', confirm: false });

    expect(client.tx.wasm).toHaveBeenCalledWith(
      'store',
      [projectMetadata.wasm.optimizedFilePath],
      expect.objectContaining({
        from: 'alice',
        chainId: 'titus-1',
        node: expect.anything(),
        flags: ['--yes']
      })
    );
  });

  test('saves the wasm codeId', async () => {
    jest.spyOn(client.query, 'txEventAttribute');
    jest.spyOn(mockConfig.deployments, 'add');

    jest.spyOn(client.query, 'wasmCode')
      .mockRejectedValue('should not happen');

    await Store(client, { verify: false, from: 'alice' });

    expect(client.query.txEventAttribute).toHaveBeenCalledWith(
      Fixtures.txWasmStore.txhash,
      'store_code',
      'code_id',
      expect.objectContaining({
        node: expect.anything()
      })
    );

    expect(mockConfig.deployments.add).toHaveBeenCalledWith({
      type: 'store',
      chainId: 'titus-1',
      codeId: 253,
      txhash: Fixtures.txWasmStore.txhash
    });
  });

  test('does not validate', async () => {
    jest.spyOn(client.query, 'wasmCode')
      .mockRejectedValue('should not happen');

    await Store(client, { verify: false, from: 'alice' });

    expect(client.query.wasmCode).not.toHaveBeenCalled();
  });
});

describe('validate', () => {
  const client = createClient();

  beforeEach(() => {
    jest.spyOn(client.query, 'wasmCode')
      .mockResolvedValue(Fixtures.queryTxWasmStore);

    readFile.mockResolvedValue(Buffer.from('wasm content'));
  });

  test('does not store', async () => {
    jest.spyOn(client.tx, 'wasm')
      .mockRejectedValue('should not happen');

    await Store(client, { store: false, from: 'alice' });

    expect(client.tx.wasm).not.toHaveBeenCalled();
  });

  test('downloads the wasm stored on-chain', async () => {
    await Store(client, { store: false, from: 'bob' });

    expect(client.query.wasmCode).toHaveBeenCalledWith(
      253,
      `${projectMetadata.wasm.optimizedFilePath.replace('.wasm', '_download.wasm')}`,
      expect.objectContaining({
        node: expect.anything()
      })
    );
  });

  test('compares the local and downloaded wasm files checksums', async () => {
    await Store(client, { store: false, from: 'bob' });

    expect(readFile).toHaveBeenCalledWith(
      projectMetadata.wasm.optimizedFilePath
    );

    expect(readFile).toHaveBeenCalledWith(
      `${projectMetadata.wasm.optimizedFilePath.replace('.wasm', '_download.wasm')}`
    );
  });
});

function createClient() {
  return new ArchwayClient({ extraArgs: ['--keyring-backend', 'test'] });
}
