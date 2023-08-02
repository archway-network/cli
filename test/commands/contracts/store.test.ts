import { expect, test } from '@oclif/test';
import fs from 'node:fs/promises';
import sinon, { SinonStub } from 'sinon';
import { SigningArchwayClient } from '@archwayhq/arch3.js';
import keyring from '@archwayhq/keyring-go';

import { Cargo, Contracts } from '../../../src/domain';
import {
  aliceAccountName,
  aliceStoreEntry,
  aliceStoredAccount,
  configString,
  contractProjectMetadata,
  dummyStoreTransaction,
} from '../../dummies';
import * as FilesystemUtils from '../../../src/utils/filesystem';

describe('contracts store', () => {
  const contractName = contractProjectMetadata.name;
  let readStub: SinonStub;
  let writeStub: SinonStub;
  let mkdirStub: SinonStub;
  let readSubDirStub: SinonStub;
  let keyringGetStub: SinonStub;
  let keyringListStub: SinonStub;
  let metadataStub: SinonStub;
  let validWorkspaceStub: SinonStub;
  let signingClientStub: SinonStub;
  before(() => {
    readStub = sinon.stub(fs, 'readFile').callsFake(async () => configString);
    writeStub = sinon.stub(fs, 'writeFile');
    mkdirStub = sinon.stub(fs, 'mkdir');
    readSubDirStub = sinon.stub(FilesystemUtils, 'readSubDirectories').callsFake(async () => [contractProjectMetadata.name]);
    keyringGetStub = sinon.stub(keyring.OsStore, 'get').callsFake(() => aliceStoredAccount);
    keyringListStub = sinon.stub(keyring.OsStore, 'list').callsFake(() => [aliceStoreEntry]);
    metadataStub = sinon.stub(Cargo.prototype, 'projectMetadata').callsFake(async () => contractProjectMetadata);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    validWorkspaceStub = sinon.stub(Contracts.prototype, 'assertValidWorkspace').callsFake(async () => {});
    signingClientStub = sinon
      .stub(SigningArchwayClient, 'connectWithSigner')
      .callsFake(async () => ({ upload: async () => dummyStoreTransaction } as any));
  });
  after(() => {
    readStub.restore();
    writeStub.restore();
    mkdirStub.restore();
    readSubDirStub.restore();
    keyringGetStub.restore();
    keyringListStub.restore();
    metadataStub.restore();
    validWorkspaceStub.restore();
    signingClientStub.restore();
  });
  describe('Stores the smart contract', () => {
    test
      .stdout()
      .command(['contracts store', contractName, `--from=${aliceAccountName}`])
      .it('Uploads wasm file', ctx => {
        expect(ctx.stdout).to.contain('uploaded');
        expect(ctx.stdout).to.contain(dummyStoreTransaction.codeId);
        expect(ctx.stdout).to.contain('Transaction:');
        expect(ctx.stdout).to.contain(dummyStoreTransaction.transactionHash);
      });
  });

  describe('Prints json output', () => {
    test
      .stdout()
      .command(['contracts store', contractName, `--from=${aliceAccountName}`, '--json'])
      .it('Uploads wasm file', ctx => {
        expect(ctx.stdout).to.not.contain('uploaded');
        expect(ctx.stdout).to.contain(dummyStoreTransaction.transactionHash);
        expect(ctx.stdout).to.contain(dummyStoreTransaction.codeId);
        expect(ctx.stdout).to.contain(dummyStoreTransaction.originalSize);
        expect(ctx.stdout).to.contain(dummyStoreTransaction.originalChecksum);
        expect(ctx.stdout).to.contain(dummyStoreTransaction.gasUsed);
      });
  });
});
