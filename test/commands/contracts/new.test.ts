import { expect, test } from '@oclif/test';
import prompts from 'prompts';
import spawk from 'spawk';
import sinon, { SinonSpy } from 'sinon';

import { CargoStubs, ConfigStubs } from '../../stubs';

describe('contracts new', () => {
  const contractName = 'test-name';
  const templateName = 'default';

  const configStubs = new ConfigStubs();
  const cargoStubs = new CargoStubs();

  let promptsSpy: SinonSpy;

  before(() => {
    spawk.preventUnmatched();
    configStubs.init();
    configStubs.assertIsValidWorkspace();
    cargoStubs.projectMetadata();
    promptsSpy = sinon.spy(prompts, 'prompt');
  });

  after(() => {
    configStubs.restoreAll();
    cargoStubs.restoreAll();
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
