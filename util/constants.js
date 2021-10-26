module.exports={
    Archwayd: {
        cmd: 'docker',
        localDir: '/var/tmp/.archwayd',
        args: ['run', '-it', '--volume=/var/tmp/.archwayd:/root/.archway','drewstaylor/archwayd:latest','archwayd']
    }
}