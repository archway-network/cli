import { expect, test } from '@oclif/test';

import ConfigChains from '../../../src/commands/config/chains';
import { chainString } from '../../dummies';
import { ConfigStubs, FilesystemStubs } from '../../stubs';

const expectHelp = (ctx: any) => {
  expect(ctx.stdout).to.contain('Description:');
  expect(ctx.stdout).to.contain('Usage');
  expect(ctx.stdout).to.contain('Available commands:');
  expect(ctx.stdout).to.contain(ConfigChains.summary.split('.')[0]);
};

describe('config chains', () => {
  const configStubs = new ConfigStubs();
  const filesystemStubs = new FilesystemStubs();

  before(() => {
    configStubs.init();
    filesystemStubs.writeFile();
    filesystemStubs.readFile(chainString);
    filesystemStubs.mkdir();
    filesystemStubs.accessFail();
  });

  after(() => {
    configStubs.restoreAll();
    filesystemStubs.restoreAll();
  });

  describe('import', () => {
    test
      .stdout()
      .command(['config chains import', 'constantine-3'])
      .it('imports chain and writes file', ctx => {
        expect(ctx.stdout).to.contain('Imported chain');
        expect(filesystemStubs.stubbedWriteFile?.called).to.be.true;
      });

    test
      .stdout()
      .stderr()
      .command(['config chains import'])
      .catch(/(Please specify the file)/)
      .it('fails on missing filename');

    test
      .stdout()
      .stderr()
      .command(['config chains import', 'constantine-3', '"{}"'])
      .catch(/(Please specify only one file to import)/)
      .it('fails on double input');
  });

  describe('use', () => {
    test
      .stdout()
      .command(['config chains use', 'constantine-3'])
      .it('updates config file to use chain', ctx => {
        expect(ctx.stdout).to.contain('Switched chain to');
        expect(filesystemStubs.stubbedWriteFile?.called).to.be.true;
      });
  });

  describe('help', () => {
    test.stdout().command(['config chains']).it('shows the config help when no other arguments', expectHelp);

    test.stdout().command(['config chains', '--help']).it('shows the config help when the flag is set', expectHelp);
  });
});
