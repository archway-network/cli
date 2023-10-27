import path from 'node:path';

import { expect, test } from '@oclif/test';

import { ChainData } from '../../../src/commands/config/chains/list';
import { chainString } from '../../dummies';
import { ConfigStubs, FilesystemStubs } from '../../stubs';

const chainSpecPath = path.join(__dirname, '../../../scripts/local-1.json');

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
      .command(['config chains import', chainSpecPath])
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
      .command(['config chains import', 'package.json', '"{}"'])
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

  describe('list', () => {
    test
      .stdout()
      .command(['config chains list'])
      .it('lists all available chains', ctx => {
        expect(ctx.stdout).to.contain('Current');
        expect(ctx.stdout).to.contain('Chain ID');
        expect(ctx.stdout).to.contain('Name');
        expect(ctx.stdout).to.contain('constantine-3');
        expect(ctx.stdout).to.contain('archway-1');

        const returned = ctx.returned as readonly ChainData[];
        expect(returned.length).to.be.gte(2);

        const chainIds = returned.map(({ current, chainId }) => ({ current, chainId }));
        expect(chainIds).to.deep.contain({ current: true, chainId: 'constantine-3' });
        expect(chainIds).to.deep.contain({ current: false, chainId: 'archway-1' });
      });
  });
});
