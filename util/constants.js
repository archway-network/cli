module.exports={
    Archwayd: {
        cmd: 'docker',
        args: ['run', '-it', '--volume=/var/tmp/.archwayd:/root/.archway','drewstaylor/archwayd:latest','archwayd']
    }
}