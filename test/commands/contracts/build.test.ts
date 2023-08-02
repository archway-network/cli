import { expect, test } from '@oclif/test';
import spawk from 'spawk';
import fs from 'node:fs/promises';
import sinon, { SinonStub } from 'sinon';

import { Cargo, Contracts, DockerOptimizer } from '../../../src/domain';
import { configString, contractProjectMetadata } from '../../dummies';
import * as FilesystemUtils from '../../../src/utils/filesystem';

describe('contracts build', () => {
  const contractName = contractProjectMetadata.name;
  let readStub: SinonStub;
  let writeStub: SinonStub;
  let mkdirStub: SinonStub;
  let readSubDirStub: SinonStub;
  let metadataStub: SinonStub;
  let validWorkspaceStub: SinonStub;
  let optimizerStub: SinonStub;
  before(() => {
    spawk.preventUnmatched();
    readStub = sinon.stub(fs, 'readFile').callsFake(async () => configString);
    writeStub = sinon.stub(fs, 'writeFile');
    mkdirStub = sinon.stub(fs, 'mkdir');
    readSubDirStub = sinon.stub(FilesystemUtils, 'readSubDirectories').callsFake(async () => [contractProjectMetadata.name]);
    metadataStub = sinon.stub(Cargo.prototype, 'projectMetadata').callsFake(async () => contractProjectMetadata);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    validWorkspaceStub = sinon.stub(Contracts.prototype, 'assertValidWorkspace').callsFake(async () => {});
  });
  after(() => {
    readStub.restore();
    writeStub.restore();
    mkdirStub.restore();
    readSubDirStub.restore();
    metadataStub.restore();
    validWorkspaceStub.restore();
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
      optimizerStub = sinon.stub(DockerOptimizer.prototype, 'run').callsFake(async () => ({ statusCode: 0 }));
    });
    after(() => {
      optimizerStub.restore();
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
      optimizerStub = sinon.stub(DockerOptimizer.prototype, 'run').callsFake(async () => ({ error: expectedError, statusCode: 1 }));
    });
    after(() => {
      optimizerStub.restore();
    });
    test
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
