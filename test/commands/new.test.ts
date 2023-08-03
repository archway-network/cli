import { expect, test } from '@oclif/test';
import prompts from 'prompts';
import spawk from 'spawk';
import sinon, { SinonSpy } from 'sinon';

import { CargoStubs, FilesystemStubs } from '../stubs';

describe('new', () => {
  const projectName = 'test-name';

  const fileSystemStubs = new FilesystemStubs();
  const cargoStubs = new CargoStubs();

  let promptsSpy: SinonSpy;

  before(() => {
    spawk.preventUnmatched();
    fileSystemStubs.writeFile();
    fileSystemStubs.mkdir();
    cargoStubs.projectMetadata();
    promptsSpy = sinon.spy(prompts, 'prompt');
  });

  after(() => {
    fileSystemStubs.restoreAll();
    cargoStubs.restoreAll();
    promptsSpy.restore();
  });

  describe('success', () => {
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

  describe('failure', () => {
    before(() => {
      fileSystemStubs.access();

      // Cargo generate call
      spawk.spawn('cargo');
      // Cargo generate contract call
      spawk.spawn('cargo');
    });

    after(() => {
      fileSystemStubs.stubbedAccess?.restore();
    });

    test
      .stdout()
      .stderr()
      .command(['new', projectName, '--chain=constantine-3', '--contract-name=test-contract', '--template=default'])
      .catch(/(Config file).*(already exists)/)
      .it('fails on file already exists');
  });
});
