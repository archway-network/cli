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
  dummyPremiumTransaction,
  instantiateDeployment,
} from '../../dummies';
import * as FilesystemUtils from '../../../src/utils/filesystem';

import { InstantiateDeployment } from '../../../src/types';

describe('contracts premium', () => {
  const contractName = contractProjectMetadata.name;
  const newFee = '3aconst';
  let readStub: SinonStub;
  let writeStub: SinonStub;
  let mkdirStub: SinonStub;
  let readSubDirStub: SinonStub;
  let keyringGetStub: SinonStub;
  let keyringListStub: SinonStub;
  let metadataStub: SinonStub;
  let validWorkspaceStub: SinonStub;
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
    findInstantiateStub = sinon
      .stub(Contracts.prototype, 'findInstantiateDeployment')
      .callsFake(() => instantiateDeployment as InstantiateDeployment);
    signingClientStub = sinon
      .stub(SigningArchwayClient, 'connectWithSigner')
      .callsFake(async () => ({ setContractPremium: async () => dummyPremiumTransaction } as any));
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
    findInstantiateStub.restore();
    signingClientStub.restore();
  });

  test
    .stdout()
    .command(['contracts premium', contractName, `--premium-fee=${newFee}`, `--from=${aliceAccountName}`])
    .it('Sets the premium fee for a smart contract', ctx => {
      expect(ctx.stdout).to.contain('Premium for the contract');
      expect(ctx.stdout).to.contain('updated');
      expect(ctx.stdout).to.contain(newFee);
      expect(ctx.stdout).to.contain('Transaction:');
      expect(ctx.stdout).to.contain(dummyPremiumTransaction.transactionHash);
    });

  test
    .stdout()
    .command(['contracts premium', contractName, `--premium-fee=${newFee}`, `--from=${aliceAccountName}`, '--json'])
    .it('Prints json output', ctx => {
      expect(ctx.stdout).to.not.contain('uploaded');
      expect(ctx.stdout).to.contain(dummyPremiumTransaction.transactionHash);
      expect(ctx.stdout).to.contain(dummyPremiumTransaction.premium.contractAddress);
      expect(ctx.stdout).to.contain(dummyPremiumTransaction.premium.flatFee.denom);
      expect(ctx.stdout).to.contain(dummyPremiumTransaction.premium.flatFee.amount);
      expect(ctx.stdout).to.contain(dummyPremiumTransaction.gasUsed);
    });
});
