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

  describe('Build only', () => {
    before(() => {
      // Cargo build call
      spawk.spawn('cargo');
      // Cargo generate wasm call
      spawk.spawn('cargo');
    });

    test
      .stdout()
      .command(['contracts build', contractName])
      .it('Generates wasm file', ctx => {
        expect(ctx.stdout).to.contain('Wasm binary saved to');
        expect(ctx.stdout).to.contain(contractProjectMetadata.wasm.filePath);
      });
  });

  describe('Build optimized', () => {
    before(() => {
      optimizerStubs.optimizerSuccess();
    });

    after(() => {
      optimizerStubs.restoreAll();
    });

    test
      .stdout()
      .command(['contracts build', '--optimize', contractName])
      .it('Generates optimized wasm file', ctx => {
        expect(ctx.stdout).to.contain('Optimized Wasm binary saved to');
        expect(ctx.stdout).to.contain(contractProjectMetadata.wasm.optimizedFilePath);
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
      .command(['contracts build', '--optimize', contractName])
      .catch(new RegExp(expectedError))
      .it('fails on error code returned');
  });

  describe('Build with schemas', () => {
    before(() => {
      // Cargo build call
      spawk.spawn('cargo');
      // Cargo generate wasm call
      spawk.spawn('cargo');
      // Cargo generate schemas call
      spawk.spawn('cargo');
    });

    test
      .stdout()
      .command(['contracts build', '--schemas', contractName])
      .it('Builds wasm file and generates json schema files', ctx => {
        expect(ctx.stdout).to.contain(contractProjectMetadata.wasm.filePath);
        expect(ctx.stdout).to.contain('Schemas generated');
      });
  });
});
