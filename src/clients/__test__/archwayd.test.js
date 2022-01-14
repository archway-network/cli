const { DefaultArchwaydVersion, DefaultArchwaydHome, buildClient } = require('../archwayd');
const { spawn } = require('child_process');
const EventEmitter = require('events');
const { Writable } = require('stream');

jest.mock('child_process');

describe('DefaultArchwayClient', () => {
  describe('constructor', () => {
    test('builds a client that runs the archwayd binary', () => {
      const client = buildClient();
      const command = client.getCommand();
      expect(command).toEqual('archwayd');
    });
  });

  describe('getExtraArgs', () => {
    test('saves the extraArgs property', () => {
      const extraArgs = ['--foo', '--bar'];
      const client = buildClient({ extraArgs });
      expect(client.getExtraArgs()).toEqual(extraArgs);
    });
  });

  describe('parseArgs', () => {
    test('extends the supplied args', () => {
      const extraArgs = ['--foo', '--bar'];
      const client = buildClient({ extraArgs });

      const args = ['keys', 'list'];
      const expectedArgs = [...extraArgs, ...args];
      const actual = client.parseArgs(args);
      expect(actual).toEqual(expect.arrayContaining(expectedArgs));
    });
  });

  describe('getWorkingDir', () => {
    test('returns the current folder', () => {
      const client = buildClient();
      expect(client.getWorkingDir()).toEqual('.');
    });
  });

  describe('run', () => {
    const client = buildClient({ extraArgs: ['--keyring-backend', 'test'] });

    test('runs the archwayd binary with valid arguments', async () => {
      spawn.mockResolvedValue(() => Promise.resolve({}));
      await client.run('keys', 'list');

      expect(spawn).toHaveBeenCalledWith(
        client.getCommand(),
        ['--keyring-backend', 'test', 'keys', 'list'],
        { stdio: ['inherit', 'pipe', 'pipe'] }
      );
    });

    test('returns the spawned process', async () => {
      const mockProcess = new EventEmitter();
      mockProcess.stdin = new Writable();
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();
      spawn.mockResolvedValue(mockProcess);

      const process = await client.run('keys', 'list');
      expect(process).toBe(mockProcess);
    });
  });
});

describe('DockerArchwayClient', () => {
  describe('constructor', () => {
    test('builds a client that runs using Docker', () => {
      const client = buildClient({ docker: true });
      const command = client.getCommand();
      expect(command).toEqual('docker');
    });
  });

  describe('getExtraArgs', () => {
    test('extends the extraArgs with Docker args', () => {
      const client = buildClient({ docker: true });
      const expectedArgs = [
        'run',
        '--rm',
        '-it',
        `--volume=${DefaultArchwaydHome}:/root/.archway`,
        `archwaynetwork/archwayd:${DefaultArchwaydVersion}`
      ];
      expect(client.getExtraArgs()).toEqual(expect.arrayContaining(expectedArgs));
    });

    test('allows overriding the archwayd home path and version', () => {
      const archwaydHome = '/tmp/.archwayd';
      const archwaydVersion = 'latest';
      const client = buildClient({ docker: true, archwaydHome, archwaydVersion });
      const expectedArgs = [
        `--volume=${archwaydHome}:/root/.archway`,
        `archwaynetwork/archwayd:${archwaydVersion}`
      ];
      expect(client.getExtraArgs()).toEqual(expect.arrayContaining(expectedArgs));
    });
  });

  describe('getWorkingDir', () => {
    test('returns the current archwayd home', () => {
      const archwaydHome = '/tmp/.archwayd';
      const client = buildClient({ docker: true, archwaydHome });
      expect(client.getWorkingDir()).toEqual(archwaydHome);
    });
  });
});
