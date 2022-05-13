const { spawn } = require('child_process');

async function main(name, options = {}) {
    // TODO: parameters. start / reset 

    var command;

    switch(name) {
    case 'new':
        // TODO: `archway chain new DSRV --chain-id test`
        //   - Handle already exist.

        console.log('Configure new chain');

        // - Add genesis account.
        // - gettx -> collect gentx.
        // - Create configs.
        // - print wallet address and mnemonic.
        //   - networkid
        break;
    case 'start':
        console.log("Local chain start");
        command = spawn('archwayd', [name]);
        break;
    case 'reset':
        break;
    }

    command.stdout.on('data', (data) => {
        process.stdout.write(data.toString());
    });

    command.stderr.on('data', (data) => {
        process.stdout.write(data.toString());
    });
}

module.exports = main;