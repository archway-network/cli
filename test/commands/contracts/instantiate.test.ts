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
  dummyInstantiateTransaction,
  storeDeployment,
} from '../../dummies';
import * as FilesystemUtils from '../../../src/utils/filesystem';

import { StoreDeployment } from '../../../src/types';

describe('contracts instantiate', () => {
  const contractName = contractProjectMetadata.name;
  let readStub: SinonStub;
  let writeStub: SinonStub;
  let mkdirStub: SinonStub;
  let readSubDirStub: SinonStub;
  let keyringGetStub: SinonStub;
  let keyringListStub: SinonStub;
  let metadataStub: SinonStub;
  let validWorkspaceStub: SinonStub;
  let validateSchemaStub: SinonStub;
  let findStoreStub: SinonStub;
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
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    validateSchemaStub = sinon.stub(Contracts.prototype, 'assertValidInstantiateArgs').callsFake(async () => {});
    findStoreStub = sinon.stub(Contracts.prototype, 'findStoreDeployment').callsFake(async () => storeDeployment as StoreDeployment);
    signingClientStub = sinon
      .stub(SigningArchwayClient, 'connectWithSigner')
      .callsFake(async () => ({ instantiate: async () => dummyInstantiateTransaction } as any));
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
    validateSchemaStub.restore();
    findStoreStub.restore();
    signingClientStub.restore();
  });
  describe('Instantiates the smart contract', () => {
    test
      .stdout()
      .command(['contracts instantiate', contractName, '--args={}', `--from=${aliceAccountName}`])
      .it('Instantiates smart contract', ctx => {
        expect(ctx.stdout).to.contain('instantiated');
        expect(ctx.stdout).to.contain(dummyInstantiateTransaction.contractAddress);
        expect(ctx.stdout).to.contain('Transaction:');
        expect(ctx.stdout).to.contain(dummyInstantiateTransaction.transactionHash);
      });
  });

  describe('Prints json output', () => {
    test
      .stdout()
      .command(['contracts instantiate', contractName, '--args={}', `--from=${aliceAccountName}`, '--json'])
      .it('Instantiates smart contract', ctx => {
        expect(ctx.stdout).to.not.contain('uploaded');
        expect(ctx.stdout).to.contain(dummyInstantiateTransaction.transactionHash);
        expect(ctx.stdout).to.contain(dummyInstantiateTransaction.contractAddress);
        expect(ctx.stdout).to.contain(dummyInstantiateTransaction.gasUsed);
      });
  });
});
