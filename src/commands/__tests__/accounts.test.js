const Accounts = require('../accounts');
const { createClient } = require('../../clients/archwayd');
const EventEmitter = require('events');
const { Writable } = require('stream');

describe('add', () => {
  test('adds a new key to the keychain', async () => {
    const client = await createTestClient();
    const mockProcess = createMockProcess();
    const runMock = jest.spyOn(client, 'runInherited');
    runMock.mockResolvedValue(mockProcess);
    await Accounts(client, { add: 'test-key' });
    expect(runMock).toHaveBeenCalledWith('keys', 'add', 'test-key');
  });
});

describe('list', () => {
  test('lists existing keys', async () => {
    const client = await createTestClient();
    const mockProcess = createMockProcess();
    const runMock = jest.spyOn(client, 'runInherited');
    runMock.mockResolvedValue(mockProcess);
    await Accounts(client, {});
    expect(runMock).toHaveBeenCalledWith('keys', 'list');
  });
});

async function createTestClient() {
  return await createClient({ docker: true, extraArgs: ['--keyring-backend', 'test'] });
}

function createMockProcess() {
  const mockProcess = new EventEmitter();
  mockProcess.stdin = new Writable();
  mockProcess.stdout = new EventEmitter();
  mockProcess.stderr = new EventEmitter();
  return mockProcess;
}
