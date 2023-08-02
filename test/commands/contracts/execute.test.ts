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
  dummyExecuteTransaction,
  instantiateDeployment,
} from '../../dummies';
import * as FilesystemUtils from '../../../src/utils/filesystem';

import { InstantiateDeployment } from '../../../src/types';

describe('contracts execute', () => {
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
  let findInstantiateStub: SinonStub;
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
    validateSchemaStub = sinon.stub(Contracts.prototype, <any>'assertValidJSONSchema').callsFake(async () => {});
    findInstantiateStub = sinon
      .stub(Contracts.prototype, 'findInstantiateDeployment')
      .callsFake(() => instantiateDeployment as InstantiateDeployment);
    signingClientStub = sinon
      .stub(SigningArchwayClient, 'connectWithSigner')
      .callsFake(async () => ({ execute: async () => dummyExecuteTransaction } as any));
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
    findInstantiateStub.restore();
    signingClientStub.restore();
  });

  test
    .stdout()
    .command(['contracts execute', contractName, '--args={}', `--from=${aliceAccountName}`])
    .it('Executes a transaction in a contract', ctx => {
      expect(ctx.stdout).to.contain('Executed contract');
      expect(ctx.stdout).to.contain(contractName);
      expect(ctx.stdout).to.contain('Transaction:');
      expect(ctx.stdout).to.contain(dummyExecuteTransaction.transactionHash);
    });

  test
    .stdout()
    .command(['contracts execute', contractName, '--args={}', `--from=${aliceAccountName}`, '--json'])
    .it('Prints json output', ctx => {
      expect(ctx.stdout).to.not.contain('Executed contract');
      expect(ctx.stdout).to.contain(dummyExecuteTransaction.transactionHash);
      expect(ctx.stdout).to.contain(dummyExecuteTransaction.gasWanted);
      expect(ctx.stdout).to.contain(dummyExecuteTransaction.gasUsed);
    });
});
