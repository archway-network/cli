import { expect, test } from '@oclif/test';
import prompts from 'prompts';
import sinon, { SinonStub, SinonSpy } from 'sinon';
import fs from 'node:fs/promises';

import { MESSAGES } from '../../../src/config';

describe('config init', () => {
  let writeStub: SinonStub;
  let accessStub: SinonStub;
  let readdirStub: SinonStub;
  let promptsSpy: SinonSpy;

  before(() => {
    prompts.inject(['constantine-3']);
    writeStub = sinon.stub(fs, 'writeFile');
    readdirStub = sinon.stub(fs, 'readdir').callsFake(async () => []);
    accessStub = sinon.stub(fs, 'access').rejects();
    promptsSpy = sinon.spy(prompts, 'prompt');
  });

  after(() => {
    accessStub.restore();
    readdirStub.restore();
    writeStub.restore();
    promptsSpy.restore();
  });

  test
    .stdout()
    .command(['config init', '--chain=constantine-3'])
    .it('creates config file with chain flag', ctx => {
      expect(ctx.stdout).to.contain(MESSAGES.SuccessPrefix);
      expect(promptsSpy.called).to.be.false;
    });

  test
    .stdout()
    .command(['config:init'])
    .it('creates config file with prompt input', ctx => {
      expect(ctx.stdout).to.contain(MESSAGES.SuccessPrefix);
      expect(promptsSpy.calledOnce).to.be.true;
    });

  test
    .stderr()
    .command(['config init', '--chain=fail'])
    .catch(/(Chain id).*(not)/)
    .it('fails on invalid chain');
});
