module.exports = {
    ArchwayDocker: {
        cmd: 'docker',
        localDir: '/var/tmp/.archwayd',
        args: ['run', '-it', '--volume=/var/tmp/.archwayd:/root/.archway', 'archwaynetwork/archwayd:latest']
    },
    ArchwayBin: {
        cmd: 'archwayd',
        localDir: '.',
        args: []
    }
}
