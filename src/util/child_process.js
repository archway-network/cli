const { spawn } = require('child_process');

function spawnPromise(command, args = [], options = { stdio: 'inherit' }) {
  const child = spawn(command, args, options);
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', code => {
      (code === 0) ? resolve() : reject(`Command ${command} failed with code ${code}`);
    });
  });
}

module.exports = { spawnPromise };
