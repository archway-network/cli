const { DefaultArchwaydVersion, DefaultArchwaydHome, createClient } = require('..');
const spawk = require('spawk');

describe('ArchwayClient', () => {
  describe('constructor', () => {
    test('builds a client that runs the archwayd binary', async () => {
      const client = await createClient();
      const command = client.command;
      expect(command).toEqual('archwayd');
    });
  });

  describe('getExtraArgs', () => {
    test('saves the extraArgs property', async () => {
      const extraArgs = ['--foo', '--bar'];
      const client = await createClient({ extraArgs });
      expect(client.extraArgs).toEqual(extraArgs);
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
      const client = await createClient({ extraArgs: ['--keyring-backend', 'test'] });
      const archwayd = spawk.spawn(client.command);

      await client.run('keys', ['list']);

      expect(archwayd.calledWith).toMatchObject({
        command: client.command,
        args: ['--keyring-backend', 'test', 'keys', 'list'],
        options: { stdio: 'inherit', encoding: 'utf8' }
      });
    });

    test('returns the spawned process data', async () => {
      const client = await createClient({ extraArgs: ['--keyring-backend', 'test'] });
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
      const client = await createClient({ extraArgs: ['--keyring-backend', 'test'] });
      const output = { txhash: '123456' };
      const archwayd = spawk.spawn(client.command)
        .stdout(JSON.stringify(output));

      const json = await client.runJson('keys', ['list'], { printStdout: false });

      expect(archwayd.calledWith).toMatchObject({
        command: client.command,
        args: ['--keyring-backend', 'test', 'keys', 'list', '--output', 'json'],
        options: { stdio: ['inherit', 'pipe', 'pipe'], maxBuffer: 1024 * 1024 }
      });

      expect(json).toMatchObject(output);
    });

    test('returns an empty JSON in case the command does not return a JSON line', async () => {
      const client = await createClient({ extraArgs: ['--keyring-backend', 'test'] });
      spawk.spawn(client.command);

      const json = client.runJson('keys', ['list'], { printStdout: false });

      expect(json).toMatchObject({});
    });
  });
});

describe('DockerArchwayClient', () => {
  describe('constructor', () => {
    test('builds a client that runs using Docker', async () => {
      const client = await createClient({ docker: true });
      const command = client.command;
      expect(command).toEqual('docker');
    });
  });

  describe('getExtraArgs', () => {
    test('extends the extraArgs with Docker args', async () => {
      const client = await createClient({ docker: true });
      expect(client.extraArgs).toEqual(expect.arrayContaining([
        'run',
        '--rm',
        '-it',
        '--network=host',
        `--volume=${DefaultArchwaydHome}:/root/.archway`,
        `archwaynetwork/archwayd:${DefaultArchwaydVersion}`
      ]));
    });

    test('allows overriding the archwayd home path and version', async () => {
      const archwaydHome = '/tmp/.archwayd';
      const archwaydVersion = 'edge';

      const client = await createClient({ docker: true, archwaydHome, archwaydVersion });

      expect(client.extraArgs).toEqual(expect.arrayContaining([
        `--volume=${archwaydHome}:/root/.archway`,
        `archwaynetwork/archwayd:${archwaydVersion}`
      ]));
    });
  });

  describe('getWorkingDir', () => {
    test('returns the current archwayd home', async () => {
      const archwaydHome = '/tmp/.archwayd';
      const client = await createClient({ docker: true, archwaydHome });
      expect(client.workingDir).toEqual(archwaydHome);
    });
  });
});
