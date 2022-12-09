/* eslint-disable camelcase */
const spawk = require('spawk');
const Cargo = require('../cargo');

beforeEach(() => {
  spawk.clean();
  spawk.preventUnmatched();
});

afterEach(() => {
  spawk.done();
  jest.clearAllMocks();
});

const cwd = '/tmp/archway-cli-test';
const cargo = new Cargo({ cwd });

describe('locateProject', () => {
  test('returns the project folder based on Cargo.toml', async () => {
    const mockCargo = spawk.spawn('cargo')
      .stdout(`${cwd}/Cargo.toml`);

    const projectPath = await cargo.locateProject();

    expect(projectPath).toEqual(cwd);
    expect(mockCargo.calledWith).toMatchObject({
      args: ['locate-project', '--message-format', 'plain'],
      options: { stdio: 'pipe', encoding: 'utf8', cwd: cwd }
    });
  });
});

describe('generate', () => {
  test('runs cargo-generate', async () => {
    const mockCargo = spawk.spawn('cargo');

    const name = 'project-name';
    const repository = 'https://github.com/archway-network/archway-templates';
    const branch = 'main';
    const template = 'increment';

    await cargo.generate(name, repository, branch, template);

    expect(mockCargo.calledWith).toMatchObject({
      args: [
        'generate',
        '--name', name,
        '--git', repository,
        '--branch', branch,
        template
      ],
      options: { stdio: 'inherit', encoding: 'utf8', cwd: cwd }
    });
  });
});

describe('build', () => {
  test('builds the project', async () => {
    const mockCargo = spawk.spawn('cargo');

    await cargo.build();

    expect(mockCargo.calledWith).toMatchObject({
      args: ['build'],
      options: { stdio: 'inherit', encoding: 'utf8', cwd: cwd }
    });
  });
});

describe('wasm', () => {
  test('builds a release wasm file', async () => {
    const mockCargo = spawk.spawn('cargo');

    await cargo.wasm();

    expect(mockCargo.calledWith).toMatchObject({
      args: ['build', '--release', '--locked', '--target', Cargo.WasmTarget],
      options: { env: { RUSTFLAGS: '-C link-arg=-s' } }
    });
  });
});

describe('metadata', () => {
  test('returns the project JSON metadata', async () => {
    const mockCargo = spawk.spawn('cargo')
      .stdout('{ "packages": [{ "name": "archway-project", "version": "0.1.0" }], "version": 1 }');

    const metadata = await cargo.metadata();

    expect(metadata).toMatchObject({
      packages: [{ name: 'archway-project', version: '0.1.0' }],
    });

    expect(mockCargo.calledWith).toMatchObject({
      args: [
        'metadata',
        '--quiet',
        '--no-deps',
        '--format-version=1'
      ],
      options: { stdio: 'pipe', maxBuffer: 1024 * 1024, encoding: 'utf8', cwd: cwd }
    });
  });
});

describe('projectMetadata', () => {
  test('returns the parsed project metadata for the project in current dir', async () => {
    const cargoMetadataOutput = {
      packages: [
        {
          name: 'foo',
          version: '0.1.0',
          manifest_path: `${cwd}/contracts/foo/Cargo.toml`,
        },
        {
          name: 'bar',
          version: '0.1.1',
          manifest_path: `${cwd}/contracts/bar/Cargo.toml`,
        },
      ],
      target_directory: `${cwd}/target`,
    };
    spawk.spawn('cargo')
      .stdout(JSON.stringify(cargoMetadataOutput));

    spawk.spawn('cargo')
      .stdout(`${cwd}/contracts/bar/Cargo.toml`);

    const metadata = await cargo.projectMetadata();

    expect(metadata).toMatchObject({
      id: 'bar 0.1.1',
      name: 'bar',
      version: '0.1.1',
      wasm: {
        fileName: 'bar.wasm',
        filePath: `${cwd}/target/${Cargo.WasmTarget}/release/bar.wasm`,
        optimizedFilePath: 'artifacts/bar.wasm'
      }
    });
  });

  test('fails if failed to resolve project metadata', async () => {
    const cargoMetadataOutput = {
      packages: [
        {
          name: 'foo',
          version: '0.1.0',
          manifest_path: `${cwd}/contracts/foo/Cargo.toml`,
        },
      ],
      target_directory: `${cwd}/target`,
    };
    spawk.spawn('cargo')
      .stdout(JSON.stringify(cargoMetadataOutput));

    spawk.spawn('cargo')
      .stdout(`${cwd}/contracts/bar/Cargo.toml`);

    await expect(async () => {
      await cargo.projectMetadata();
    }).rejects.toThrow('Failed to resolve project metadata');
  });
});
