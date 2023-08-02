import { expect, test } from '@oclif/test';
import prompts from 'prompts';
import spawk from 'spawk';
import fs from 'node:fs/promises';
import sinon, { SinonSpy, SinonStub } from 'sinon';

describe('new', () => {
  const projectName = 'test-name';
  let writeStub: SinonStub;
  let mkdirStub: SinonStub;
  let promptsSpy: SinonSpy;
  before(() => {
    spawk.preventUnmatched();
    writeStub = sinon.stub(fs, 'writeFile');
    mkdirStub = sinon.stub(fs, 'mkdir');
    promptsSpy = sinon.spy(prompts, 'prompt');
  });
  after(() => {
    writeStub.restore();
    mkdirStub.restore();
  });
  describe('without cli arguments', () => {
    before(() => {
      prompts.inject(['constantine-1', 'my-contract', true, 'increment']);
      spawk.spawn('cargo');
      spawk.spawn('cargo');
    });
    test
      .stdout()
      .command(['new', projectName])
      .it('asks for input', ctx => {
        expect(ctx.stdout).to.contain(projectName);
        expect(ctx.stdout).to.contain('created and configured for the chain');
        expect(promptsSpy.called).to.be.true;
      });
  });
  describe('with cli arguments', () => {
    before(() => {
      spawk.spawn('cargo');
      spawk.spawn('cargo');
      promptsSpy.resetHistory();
    });
    test
      .stdout()
      .command(['new', projectName, '--chain=constantine-1', '--contract-name=test-contract', '--template=default'])
      .it('doesn`t ask for input', ctx => {
        expect(ctx.stdout).to.contain(projectName);
        expect(ctx.stdout).to.contain('created and configured for the chain');
        expect(promptsSpy.called).to.be.false;
      });
  });
});
