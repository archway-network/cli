const _ = require('lodash');
const { ArchwayClient, MinimumArchwaydVersion, ValidationError, createClient } = require('..');
const spawk = require('spawk');

const isCmd = cmd => _.chain(_).head().eq(cmd).value();

describe('ArchwayClient', () => {
  describe('constructor', () => {
    test('builds a client that runs the archwayd binary', () => {
      const client = new ArchwayClient();
      const command = client.command;
      expect(command).toEqual('archwayd');
    });
  });

  describe('getExtraArgs', () => {
    test('saves the extraArgs property', () => {
      const extraArgs = ['--foo', '--bar'];
      const client = new ArchwayClient({ extraArgs });
      expect(client.extraArgs).toEqual(extraArgs);
    });
  });

  describe('parseArgs', () => {
    test('extends the supplied args', () => {
      const extraArgs = ['--foo', '--bar'];
      const client = new ArchwayClient({ extraArgs });

      const args = ['keys', 'list'];
      const expectedArgs = [...extraArgs, ...args];
      const actual = client.parseArgs(args);
      expect(actual).toEqual(expect.arrayContaining(expectedArgs));
    });
  });

  describe('getWorkingDir', () => {
    test('returns the current folder', () => {
      const client = new ArchwayClient();
      expect(client.workingDir).toEqual('.');
    });
  });

  describe('run', () => {
    beforeEach(() => {
      spawk.clean();
      spawk.preventUnmatched();
    });

    afterEach(() => {
      spawk.done();
      jest.clearAllMocks();
    });

    test('runs the archwayd binary with valid arguments', async () => {
      const client = new ArchwayClient({ extraArgs: ['--keyring-backend', 'test'] });
      const archwayd = spawk.spawn(client.command);

      await client.run('keys', ['list']);

      expect(archwayd.calledWith).toMatchObject({
        command: client.command,
        args: ['--keyring-backend', 'test', 'keys', 'list'],
        options: { stdio: 'inherit', encoding: 'utf8' },
      });
    });

    test('returns the spawned process data', async () => {
      const client = new ArchwayClient({ extraArgs: ['--keyring-backend', 'test'] });
      const archwayd = spawk.spawn(client.command).exit(1);

      const process = client.run('keys', ['list']);

      await expect(process).rejects.toThrow('Process exited with code 1');
      expect(archwayd.called).toBeTruthy();
    });
  });

  describe('runJson', () => {
    beforeEach(() => {
      spawk.clean();
      spawk.preventUnmatched();
    });

    afterEach(() => {
      spawk.done();
      jest.clearAllMocks();
    });

    test('runs archwayd and parses the output as json', async () => {
      const client = new ArchwayClient({ extraArgs: ['--keyring-backend', 'test'] });
      const output = { txhash: '123456' };
      const archwayd = spawk.spawn(client.command).stdout(JSON.stringify(output));

      const json = await client.runJson('keys', ['list'], { printOutput: false });

      expect(archwayd.calledWith).toMatchObject({
        command: client.command,
        args: ['--keyring-backend', 'test', 'keys', 'list', '--output', 'json'],
        options: { stdio: ['inherit', 'pipe', 'pipe'], maxBuffer: 1024 * 1024 },
      });

      expect(json).toMatchObject(output);
    });

    test('returns an empty JSON in case the command does not return a JSON line', () => {
      const client = new ArchwayClient({ extraArgs: ['--keyring-backend', 'test'] });
      spawk.spawn(client.command);

      const json = client.runJson('keys', ['list'], { printOutput: false });

      expect(json).toMatchObject({});
    });
  });

  describe('validateVersion', () => {
    test('throws an error if the version is not a valid semver', async () => {
      const client = new ArchwayClient({ archwaydVersion: 'x.y.z' });
      await expect(client.validateVersion()).rejects.toThrow(ValidationError);
    });

    test('throws an error if the version is lower than the minimum', async () => {
      const client = new ArchwayClient({ archwaydVersion: '0.0.1' });
      await expect(client.validateVersion()).rejects.toThrow(ValidationError);
    });

    test('throws an error if the binary version is lower than the specified', async () => {
      const client = new ArchwayClient();
      const archwayd = spawk.spawn(client.command, isCmd('version')).stdout('0.0.1');

      await expect(client.validateVersion()).rejects.toThrow(ValidationError);

      expect(archwayd.called).toBeTruthy();
    });

    test('accepts the minimum version', async () => {
      const client = new ArchwayClient();
      const archwayd = spawk.spawn(client.command, isCmd('version')).stdout(MinimumArchwaydVersion);

      await expect(client.validateVersion()).resolves.not.toThrow(ValidationError);

      expect(archwayd.called).toBeTruthy();
    });

    test('accepts anything higher than the minimum version', async () => {
      const client = new ArchwayClient({ archwaydVersion: '10.0.0' });
      const archwayd = spawk.spawn(client.command, isCmd('version')).stdout('10.0.0');

      await expect(client.validateVersion()).resolves.not.toThrow(ValidationError);

      expect(archwayd.called).toBeTruthy();
    });
  });
});

describe('createClient', () => {
  test('creates an ArchwayClient', async () => {
    spawk.spawn('archwayd', isCmd('version')).stdout(MinimumArchwaydVersion);
    const client = await createClient();
    expect(client).toBeInstanceOf(ArchwayClient);
  });

  test('validates the client version', async () => {
    const client = createClient({ archwaydVersion: '0.0.2' });
    await expect(client).rejects.toThrow(ValidationError);
  });
});
