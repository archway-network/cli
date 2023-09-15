import { expect, test } from '@oclif/test';
import spawk from 'spawk';

import { contractProjectMetadata } from '../../dummies';
import { CargoStubs, ConfigStubs, OptimizerStubs } from '../../stubs';

describe('contracts build', () => {
  const contractName = contractProjectMetadata.name;

  const configStubs = new ConfigStubs();
  const optimizerStubs = new OptimizerStubs();
  const cargoStubs = new CargoStubs();

  before(() => {
    spawk.preventUnmatched();
    configStubs.init();
    configStubs.assertIsValidWorkspace();
    cargoStubs.projectMetadata();
  });

  after(() => {
    configStubs.restoreAll();
    cargoStubs.restoreAll();
  });

  describe('Build optimized contract', () => {
    before(() => {
      optimizerStubs.optimizerSuccess();
      // Cargo generate schemas call
      spawk.spawn('cargo');
    });

    after(() => {
      optimizerStubs.restoreAll();
    });

    test
      .stdout()
      .command(['contracts build', contractName])
      .it('Generates optimized wasm file', ctx => {
        expect(ctx.stdout).to.contain('Optimized Wasm binary saved to');
        expect(ctx.stdout).to.contain(contractProjectMetadata.wasm.optimizedFilePath);
        expect(ctx.stdout).to.contain('Schemas generated');
      });
  });

  describe('Build optimized workspace (all contracts)', () => {
    before(() => {
      optimizerStubs.optimizerSuccess();
      // Cargo generate schemas call
      spawk.spawn('cargo');
    });

    after(() => {
      optimizerStubs.restoreAll();
    });

    test
      .stdout()
      .command(['contracts build'])
      .it('Generates optimized wasm file', ctx => {
        expect(ctx.stdout).to.contain('Optimized Wasm binary saved to');
        expect(ctx.stdout).to.contain(contractProjectMetadata.workspaceRoot);
        expect(ctx.stdout).to.contain('Schemas generated');
      });
  });

  describe('Docker optimizer', () => {
    const expectedError = 'Docker run failed';

    before(() => {
      optimizerStubs.optimizerFail(expectedError);
    });

    after(() => {
      optimizerStubs.restoreAll();
    });

    test
      .stdout()
      .stderr()
      .command(['contracts build', contractName])
      .catch(new RegExp(expectedError))
      .it('fails on error code returned');
  });
});
