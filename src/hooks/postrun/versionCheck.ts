import { Hook } from '@oclif/core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'promisify-child-process';
import semver from 'semver';

import { bold, green, yellow } from '@/utils';

const timeoutInDays = 1;

const hook: Hook<'postrun'> = async function (opts) {
  const skipVersionCheck = process.env.ARCHWAY_SKIP_VERSION_CHECK || '0';

  if (skipVersionCheck.toString().toLowerCase() === 'true' || Number.parseInt(skipVersionCheck, 10) === 1) {
    return;
  }

  const filePath = path.join(opts.config.cacheDir, 'version');

  const shouldRefresh = async () => {
    try {
      const { mtime } = await fs.stat(filePath);
      const staleAt = new Date(mtime.valueOf() + (1000 * 60 * 60 * 24 * timeoutInDays));
      return staleAt < new Date();
    } catch {
      return true;
    }
  };

  if (await shouldRefresh()) {
    this.log('\nChecking for updates...');
    const { stdout } = await spawn('npm', ['view', opts.config.name, 'version'], { encoding: 'utf8', stdio: 'pipe' });
    const lines = (stdout?.toString() || '').replace(/\r/g, '').split('\n');
    const remote = lines.find(item => semver.valid(item));
    await fs.writeFile(filePath, JSON.stringify({ remote, current: opts.config.version }), { encoding: 'utf-8' });
  }

  const versions = JSON.parse(await fs.readFile(filePath, { encoding: 'utf-8' }));

  if (semver.satisfies(versions.remote, `>${versions.current}`)) {
    this.log(bold(`\n${yellow('⚠️ Warning:')} A newer version of Archway CLI is available (v${green.bold(versions.remote)})`));
    this.log(bold(`Install the latest version with ${yellow.bold('npm install -g @archwayhq/cli')}`));
    this.log(
      'If you want skip this check, prepend the command with ARCHWAY_SKIP_VERSION_CHECK=true, or add it to your environment file (.bashrc, .zshrc, ...)'
    );
  }
};

export default hook;
