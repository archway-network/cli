const spawk = require('spawk');
const mockConsole = require('jest-mock-console');
const { ArchwayClient } = require('../../clients/archwayd');
const Accounts = require('../accounts');

beforeEach(() => {
  mockConsole(['info', 'warn', 'error']);

  spawk.clean();
  spawk.preventUnmatched();
});

afterEach(() => {
  spawk.done();
  jest.clearAllMocks();
});

describe('add', () => {
  test('adds a new key to the keychain', async () => {
    const client = createClient();
    const archwayd = spawk.spawn(client.command);

    await Accounts(client, { add: 'test-key' });

    expect(archwayd.calledWith).toMatchObject({
      args: expect.arrayContaining(['keys', 'add', 'test-key'])
    });
  });
});

describe('list', () => {
  test('lists existing keys', async () => {
    const client = createClient();
    const archwayd = spawk.spawn(client.command);

    await Accounts(client);

    expect(archwayd.calledWith).toMatchObject({
      args: expect.arrayContaining(['keys', 'list'])
    });
  });
});

function createClient() {
  return new ArchwayClient({ extraArgs: ['--keyring-backend', 'test'] });
}
