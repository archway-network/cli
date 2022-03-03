const spawk = require('spawk');
const mockConsole = require('jest-mock-console');
const { createClient } = require('../../clients/archwayd');
const Accounts = require('../accounts');

beforeEach(() => {
  mockConsole(['info', 'warn', 'error']);

  spawk.clean();
  spawk.preventUnmatched();
});

afterEach(() => {
  spawk.done();
  jest.resetAllMocks();
});

describe('add', () => {
  test('adds a new key to the keychain', async () => {
    const client = await createTestArchwaydClient();
    const archwayd = spawk.spawn(client.command);

    await Accounts(client, { add: 'test-key' });

    expect(archwayd.calledWith).toMatchObject({
      args: expect.arrayContaining(['keys', 'add', 'test-key'])
    });
  });
});

describe('list', () => {
  test('lists existing keys', async () => {
    const client = await createTestArchwaydClient();
    const archwayd = spawk.spawn(client.command);

    await Accounts(client);

    expect(archwayd.calledWith).toMatchObject({
      args: expect.arrayContaining(['keys', 'list'])
    });
  });
});

async function createTestArchwaydClient() {
  return await createClient({ docker: false, extraArgs: ['--keyring-backend', 'test'] });
}
