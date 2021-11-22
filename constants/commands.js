module.exports = {
    ArchwayDocker: {
        cmd: 'docker',
        localDir: `${process.env.HOME}/.archwayd`,
        args: ['run', '--rm', '-it', `--volume=${process.env.HOME}/.archwayd:/root/.archway`, 'archwaynetwork/archwayd:latest']
    },
    ArchwayBin: {
        cmd: 'archwayd',
        localDir: '.',
        args: []
    }
}
