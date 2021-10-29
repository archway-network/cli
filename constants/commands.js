module.exports={
    ArchwayDocker: {
        cmd: 'docker',
        localDir: '/var/tmp/.archwayd',
        args: ['run', '-it', '--volume=/var/tmp/.archwayd:/root/.archway','drewstaylor/archwayd:latest','archwayd']
    },
    ArchwayBin: {
        cmd: 'archwayd',
        localDir: '.',
        args: []
    }
}