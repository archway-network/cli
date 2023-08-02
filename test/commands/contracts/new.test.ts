import { expect, test } from '@oclif/test';
import prompts from 'prompts';
import spawk from 'spawk';
import fs from 'node:fs/promises';
import sinon, { SinonSpy, SinonStub } from 'sinon';

import { Cargo, Contracts } from '../../../src/domain';
import { configString, contractProjectMetadata } from '../../dummies';

describe('contracts new', () => {
  const contractName = 'test-name';
  const templateName = 'default';
  let readStub: SinonStub;
  let writeStub: SinonStub;
  let mkdirStub: SinonStub;
  let metadataStub: SinonStub;
  let validWorkspaceStub: SinonStub;
  let promptsSpy: SinonSpy;
  before(() => {
    spawk.preventUnmatched();
    readStub = sinon.stub(fs, 'readFile').callsFake(async () => configString);
    writeStub = sinon.stub(fs, 'writeFile');
    mkdirStub = sinon.stub(fs, 'mkdir');
    metadataStub = sinon.stub(Cargo.prototype, 'projectMetadata').callsFake(async () => contractProjectMetadata);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    validWorkspaceStub = sinon.stub(Contracts.prototype, 'assertValidWorkspace').callsFake(async () => {});
    promptsSpy = sinon.spy(prompts, 'prompt');
  });
  after(() => {
    readStub.restore();
    writeStub.restore();
    mkdirStub.restore();
    metadataStub.restore();
    validWorkspaceStub.restore();
    promptsSpy.restore();
  });
  describe('without template name', () => {
    before(() => {
      prompts.inject([templateName]);
      // Cargo generate workspace call
      spawk.spawn('cargo');
      // Cargo generate contract call
      spawk.spawn('cargo');
    });
    test
      .stdout()
      .command(['contracts new', contractName])
      .it('asks for input', ctx => {
        expect(ctx.stdout).to.contain(contractName);
        expect(ctx.stdout).to.contain('created from template');
        expect(ctx.stdout).to.contain(templateName);
        expect(promptsSpy.called).to.be.true;
      });
  });
  describe('with template', () => {
    before(() => {
      // Cargo generate call
      spawk.spawn('cargo');
      // Cargo generate contract call
      spawk.spawn('cargo');
      promptsSpy.resetHistory();
    });
    test
      .stdout()
      .command(['contracts new', contractName, `--template=${templateName}`])
      .it('doesn`t ask for input', ctx => {
        expect(ctx.stdout).to.contain(contractName);
        expect(ctx.stdout).to.contain('created from template');
        expect(ctx.stdout).to.contain(templateName);
        expect(promptsSpy.called).to.be.false;
      });
  });
});
