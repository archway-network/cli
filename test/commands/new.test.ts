import { expect, test } from '@oclif/test';
import prompts from 'prompts';
import spawk from 'spawk';
import fs from 'node:fs/promises';
import sinon, { SinonSpy, SinonStub } from 'sinon';

import { Cargo } from '../../src/domain/Cargo';
import { contractProjectMetadata } from '../dummies/contracts';

describe('new', () => {
  const projectName = 'test-name';
  let writeStub: SinonStub;
  let mkdirStub: SinonStub;
  let metadataStub: SinonStub;
  let promptsSpy: SinonSpy;
  before(() => {
    spawk.preventUnmatched();
    writeStub = sinon.stub(fs, 'writeFile');
    mkdirStub = sinon.stub(fs, 'mkdir');
    metadataStub = sinon.stub(Cargo.prototype, 'projectMetadata').callsFake(async () => contractProjectMetadata);
    promptsSpy = sinon.spy(prompts, 'prompt');
  });
  after(() => {
    writeStub.restore();
    mkdirStub.restore();
    metadataStub.restore();
    promptsSpy.restore();
  });
  describe('without cli arguments', () => {
    before(() => {
      prompts.inject(['constantine-3', 'my-contract', true, 'increment']);
      // Cargo generate workspace call
      spawk.spawn('cargo');
      // Cargo generate contract call
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
      // Cargo generate call
      spawk.spawn('cargo');
      // Cargo generate contract call
      spawk.spawn('cargo');
      promptsSpy.resetHistory();
    });
    test
      .stdout()
      .command(['new', projectName, '--chain=constantine-3', '--contract-name=test-contract', '--template=default'])
      .it('doesn`t ask for input', ctx => {
        expect(ctx.stdout).to.contain(projectName);
        expect(ctx.stdout).to.contain('created and configured for the chain');
        expect(promptsSpy.called).to.be.false;
      });
  });
});
