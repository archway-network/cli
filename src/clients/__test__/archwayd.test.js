const { DefaultArchwaydVersion, DefaultArchwaydHome, createClient } = require('../archwayd');
const { spawn } = require('child_process');
const EventEmitter = require('events');

jest.mock('child_process');

describe('DefaultArchwayClient', () => {
  describe('constructor', () => {
    test('builds a client that runs the archwayd binary', async () => {
      const client = await createClient();
      const command = client.getCommand();
      expect(command).toEqual('archwayd');
    });
  });

  describe('getExtraArgs', () => {
    test('saves the extraArgs property', async () => {
      const extraArgs = ['--foo', '--bar'];
      const client = await createClient({ extraArgs });
      expect(client.getExtraArgs()).toEqual(extraArgs);
    });
  });

  describe('parseArgs', () => {
    test('extends the supplied args', async () => {
      const extraArgs = ['--foo', '--bar'];
      const client = await createClient({ extraArgs });

      const args = ['keys', 'list'];
      const expectedArgs = [...extraArgs, ...args];
      const actual = client.parseArgs(args);
      expect(actual).toEqual(expect.arrayContaining(expectedArgs));
    });
  });

  describe('getWorkingDir', () => {
    test('returns the current folder', async () => {
      const client = await createClient();
      expect(client.getWorkingDir()).toEqual('.');
    });
  });

  describe('run', () => {
    test('runs the archwayd binary with valid arguments', async () => {
      const client = await createClient({ extraArgs: ['--keyring-backend', 'test'] });

      spawn.mockResolvedValue(() => Promise.resolve({}));
      await client.run('keys', 'list');

      expect(spawn).toHaveBeenCalledWith(
        client.getCommand(),
        ['--keyring-backend', 'test', 'keys', 'list'],
        { stdio: ['inherit', 'pipe', 'pipe'] }
      );
    });

    test('returns the spawned process', async () => {
      const client = await createClient({ extraArgs: ['--keyring-backend', 'test'] });

      const mockProcess = new EventEmitter();
      spawn.mockResolvedValue(mockProcess);

      const process = await client.run('keys', 'list');
      expect(process).toBe(mockProcess);
    });
  });
});

describe('DockerArchwayClient', () => {
  describe('constructor', () => {
    test('builds a client that runs using Docker', async () => {
      const client = await createClient({ docker: true });
      const command = client.getCommand();
      expect(command).toEqual('docker');
    });
  });

  describe('getExtraArgs', () => {
    test('extends the extraArgs with Docker args', async () => {
      const client = await createClient({ docker: true });
      const expectedArgs = [
        'run',
        '--rm',
        '-it',
        `--volume=${DefaultArchwaydHome}:/root/.archway`,
        `archwaynetwork/archwayd:${DefaultArchwaydVersion}`
      ];
      expect(client.getExtraArgs()).toEqual(expect.arrayContaining(expectedArgs));
    });

    test('allows overriding the archwayd home path and version', async () => {
      const archwaydHome = '/tmp/.archwayd';
      const archwaydVersion = 'latest';
      const client = await createClient({ docker: true, archwaydHome, archwaydVersion });
      const expectedArgs = [
        `--volume=${archwaydHome}:/root/.archway`,
        `archwaynetwork/archwayd:${archwaydVersion}`
      ];
      expect(client.getExtraArgs()).toEqual(expect.arrayContaining(expectedArgs));
    });
  });

  describe('getWorkingDir', () => {
    test('returns the current archwayd home', async () => {
      const archwaydHome = '/tmp/.archwayd';
      const client = await createClient({ docker: true, archwaydHome });
      expect(client.getWorkingDir()).toEqual(archwaydHome);
    });
  });
});
