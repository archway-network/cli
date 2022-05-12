const { mkdir } = require('fs/promises');
const spawk = require('spawk');
const mockConsole = require('jest-mock-console');
const Cargo = require('../../clients/cargo');
const Build = require('../build');

jest.mock('fs/promises');

const mockCargo = {
  build: jest.fn(),
  wasm: jest.fn(),
  projectMetadata: jest.fn(),
};
jest.mock('../../clients/cargo', () => {
  return jest.fn(() => mockCargo);
});

beforeEach(() => {
  mockConsole(['info', 'warn', 'error']);

  spawk.clean();
  spawk.preventUnmatched();
});

afterEach(() => {
  spawk.done();
  Cargo.mockClear();
});

describe('build', () => {
  test('builds the project in debug mode', async () => {
    await Build();
    expect(mockCargo.build).toHaveBeenCalled();
  });
});

describe('optimize', () => {
  const metadata = {
    wasm: {
      fileName: 'project_name.wasm',
      filePath: `target/${Cargo.WasmTarget}/release/project_name.wasm`,
      optimizedFilePath: 'artifacts/project_name.wasm'
    }
  };

  beforeEach(() => {
    mockCargo.projectMetadata.mockReturnValue(metadata);
  });

  test('builds the wasm in release mode', async () => {
    await Build({ optimize: true });

    expect(mockCargo.wasm).toHaveBeenCalled();
  });

  test('creates the artifacts directory', async () => {
    await Build({ optimize: true });

    expect(mkdir).toHaveBeenCalledWith('artifacts', { recursive: true });
  });

  test('generates an optimized wasm in artifacts', async () => {
    const wasmOpt = spawk.spawn('wasm-opt');

    await Build({ optimize: true });

    expect(wasmOpt.calledWith).toMatchObject({
      args: ['-Os', metadata.wasm.filePath, '-o', `artifacts/${metadata.wasm.fileName}`],
      options: { encoding: 'utf8' }
    });
  });
});
