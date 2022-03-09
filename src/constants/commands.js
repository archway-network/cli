const archwayHome = `${process.env.HOME}/.archway`;
const archwaydVersion = '0.0.1';

module.exports = {
  ArchwayDocker: {
    cmd: 'docker',
    localDir: archwayHome,
    args: ['run', '--rm', '-it', `--volume=${archwayHome}:/root/.archway`, `archwaynetwork/archwayd:${archwaydVersion}`]
  },
  ArchwayBin: {
    cmd: 'archwayd',
    localDir: '.',
    args: []
  }
};
