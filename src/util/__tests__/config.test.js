const _ = require('lodash');
const fs = require('node:fs/promises');
const spawk = require('spawk');
const { Config, ConfigFilename, ConfigFileNotFoundError } = require('../config');

const Fixtures = {
  sampleConfig: require('./fixtures/sample-config.json'),
  singleProjectMetadata: require('../../clients/__tests__/fixtures/cargo-metadata-single.json'),
};

const workspaceRoot = Fixtures.singleProjectMetadata.workspace_root;
const configPath = `${workspaceRoot}/${ConfigFilename}`;

const isCmd = cmd => _.chain(_).head().eq(cmd).value();

jest.mock('node:fs/promises');

beforeEach(() => {
  spawk.clean();
  spawk.preventUnmatched();
});

afterEach(() => {
  spawk.done();
  jest.clearAllMocks();
});

describe('Config', () => {
  describe('open', () => {
    it('opens a config file present in the workspace root', async () => {
      fs.access.mockResolvedValue(undefined);
      jest.doMock(configPath, () => Fixtures.sampleConfig, { virtual: true });

      const config = await Config.open(workspaceRoot);

      expect(fs.access).toHaveBeenCalledWith(configPath);
      expect(config.data).toMatchObject(Fixtures.sampleConfig);
    });

    it('opens a config file using cargo to find the workspace root', async () => {
      spawk.spawn('cargo', isCmd('metadata'))
        .stdout(JSON.stringify(Fixtures.singleProjectMetadata));

      spawk.spawn('cargo', isCmd('locate-project'))
        .stdout(`${workspaceRoot}/Cargo.toml`);

      fs.access.mockResolvedValue(undefined);

      jest.doMock(configPath, () => Fixtures.sampleConfig, { virtual: true });

      const config = await Config.open();

      expect(fs.access).toHaveBeenCalledWith(configPath);
      expect(config.data).toMatchObject(Fixtures.sampleConfig);
    });

    it('should throw an error if no config file is found', async () => {
      fs.access.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      expect.assertions(2);

      try {
        await Config.open(workspaceRoot);
      } catch (e) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(e.cause).toBeInstanceOf(ConfigFileNotFoundError);
      }

      expect(fs.access).toHaveBeenCalledWith(configPath);
    });
  });

  describe('read', () => {
    it('reads a config file and returns the JSON data', async () => {
      fs.access.mockResolvedValue(undefined);
      jest.doMock(configPath, () => Fixtures.sampleConfig, { virtual: true });

      const data = await Config.read(workspaceRoot);

      expect(data).toMatchObject(Fixtures.sampleConfig);
    });
  });
});
