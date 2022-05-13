const spawk = require('spawk');
const Chain = require('../chain');

describe('new', () => {
    test('Configure new local chain', async () => {
        console.log('test chain new');
    });
});

describe('start local chain', () => {
    test('', async () => {
        console.log('test chain start');
        const archwayd = spawk.spawn('archwayd');

        await Chain('start', {});

        expect(archwayd.calledWith).toMatchObject({
            command: 'archwayd',
            args: ['start']
        });
    });
});