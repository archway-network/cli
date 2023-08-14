import { expect, test } from '@oclif/test';
import prompts from 'prompts';
import sinon, { SinonSpy } from 'sinon';

import { SUCCESS_PREFIX } from '../../../src/lib/base';
import { FilesystemStubs } from '../../stubs';

describe('config init', () => {
  const filesystemStubs = new FilesystemStubs();
  let promptsSpy: SinonSpy;

  before(() => {
    prompts.inject(['constantine-3']);
    filesystemStubs.writeFile();
    filesystemStubs.readdir();
    filesystemStubs.accessFail();
    promptsSpy = sinon.spy(prompts, 'prompt');
  });

  after(() => {
    filesystemStubs.restoreAll();
    promptsSpy.restore();
  });

  test
    .stdout()
    .command(['config init', '--chain=constantine-3'])
    .it('creates config file with chain flag', ctx => {
      expect(ctx.stdout).to.contain(SUCCESS_PREFIX);
      expect(promptsSpy.called).to.be.false;
    });

  test
    .stdout()
    .command(['config init'])
    .it('creates config file with prompt input', ctx => {
      expect(ctx.stdout).to.contain(SUCCESS_PREFIX);
      expect(promptsSpy.calledOnce).to.be.true;
    });

  test
    .stdout()
    .stderr()
    .command(['config init', '--chain=fail'])
    .catch(/(Chain id).*(not)/)
    .it('fails on invalid chain');
});
