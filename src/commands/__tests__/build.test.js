const mockConsole = require('jest-mock-console');
const Build = require('../build');

const mockCargo = {
  build: jest.fn(),
  wasm: jest.fn(),
  projectMetadata: jest.fn(),
};
jest.mock('../../clients/cargo', () => jest.fn(() => mockCargo));

const mockWasmOptimizer = {
  run: jest.fn(),
};
jest.mock('../../clients/wasm_optimizer', () => jest.fn(() => mockWasmOptimizer));

const cwd = '/tmp/test/archway-project';

beforeEach(() => {
  mockConsole(['info', 'warn', 'error']);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('build', () => {
  test('builds the project in debug mode', async () => {
    mockCargo.projectMetadata.mockReturnValue({
      wasm: {
        filePath: `${cwd}/target/wasm32-unknown-unknown/release/archway_project.wasm`
      },
    });

    await Build();

    expect(mockCargo.build).toHaveBeenCalled();
  });
});

describe('optimize', () => {
  test('runs the wasm optimizer', async () => {
    mockCargo.projectMetadata.mockReturnValue({
      wasm: {
        optimizedFilePath: `${cwd}/artifacts/archway_project.wasm`
      },
      workspaceRoot: cwd,
      isWorkspace: true
    });

    mockWasmOptimizer.run.mockReturnValue({ error: null, statusCode: 0 });

    await Build({ optimize: true });

    expect(mockWasmOptimizer.run).toHaveBeenCalledWith(cwd, true);
  });

  test('fails if the wasm optimizer exited with an error code', async () => {
    mockCargo.projectMetadata.mockReturnValue({
      wasm: {
        optimizedFilePath: `${cwd}/target/wasm32-unknown-unknown/release/archway_project.wasm`
      },
      workspaceRoot: cwd,
      isWorkspace: false
    });

    mockWasmOptimizer.run.mockReturnValue({ error: 'Docker run failed', statusCode: 1 });

    await expect(async () => {
      await Build({ optimize: true });
    }).rejects.toThrow('Docker run failed');

    expect(mockWasmOptimizer.run).toHaveBeenCalledWith(cwd, false);
  });
});
