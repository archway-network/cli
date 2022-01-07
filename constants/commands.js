const { accessSync } = require('fs');
const { rename, rm } = require('fs/promises');
const { createInterface } = require('readline');
const prompt = require('./prompt');

const archwayHome = `${process.env.HOME}/.archway`;

function pathExists(path) {
  try {
    accessSync(path);
    return true;
  } catch (error) {
    return false;
  }
}

async function checkHomePath() {
  const oldArchwayHome = '/var/tmp/.archwayd';

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    if (pathExists(oldArchwayHome)) {
      if (!await prompt.askBoolean(rl, `Found an Archway keystore in ${oldArchwayHome}. Move it to the new path at ~/.archway?`, 'Y')) {
        return;
      }

      if (pathExists(archwayHome)) {
        if (!await prompt.askBoolean(rl, `The directory ~/.archway is not empty. Would you like to overwrite its contents?`, 'Y')) {
          return;
        }

        await rm(archwayHome, { recursive: true, force: true });
      }

      await rename(oldArchwayHome, archwayHome);
    }
  } catch (error) {
    console.error(`Failed to move directory: ${error.message}\n`);
  } finally {
    rl.close();
  }
}

module.exports = {
  ArchwayDocker: {
    cmd: 'docker',
    localDir: archwayHome,
    args: ['run', '--rm', '-it', `--volume=${archwayHome}:/root/.archway`, 'archwaynetwork/archwayd:latest']
  },
  ArchwayBin: {
    cmd: 'archwayd',
    localDir: '.',
    args: []
  },
  checkHomePath: checkHomePath
};
