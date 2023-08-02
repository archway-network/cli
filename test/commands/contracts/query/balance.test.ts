import { expect, test } from '@oclif/test';
import fs from 'node:fs/promises';
import sinon, { SinonStub } from 'sinon';
import keyring from '@archwayhq/keyring-go';
import { StargateClient } from '@cosmjs/stargate';

import { Cargo, Contracts } from '../../../../src/domain';
import {
  aliceStoreEntry,
  aliceStoredAccount,
  configString,
  contractProjectMetadata,
  dummyAmount,
  instantiateDeployment,
} from '../../../dummies';
import * as FilesystemUtils from '../../../../src/utils/filesystem';

import { InstantiateDeployment } from '../../../../src/types';
import { expectOutputJSON } from '../../../helpers/expect';

describe('contracts query balance', () => {
  const contractName = contractProjectMetadata.name;
  let readStub: SinonStub;
  let writeStub: SinonStub;
  let mkdirStub: SinonStub;
  let readSubDirStub: SinonStub;
  let keyringGetStub: SinonStub;
  let keyringListStub: SinonStub;
  let metadataStub: SinonStub;
  let validWorkspaceStub: SinonStub;
  let findInstantiateStub: SinonStub;
  let stargateClientStub: SinonStub;
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
    stargateClientStub = sinon
      .stub(StargateClient, 'connect')
      .callsFake(async () => ({ getAllBalances: async () => [dummyAmount] } as any));
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
    stargateClientStub.restore();
  });

  test
    .stdout()
    .command(['contracts query balance', contractName])
    .it('Query balance of a contract', ctx => {
      expect(ctx.stdout).to.contain('Balances for contract');
      expect(ctx.stdout).to.contain(instantiateDeployment.contract.name);
      expect(ctx.stdout).to.contain(dummyAmount.amount);
      expect(ctx.stdout).to.contain(dummyAmount.denom);
    });

  test.stdout().command(['contracts query balance', contractName, '--json']).it('Prints json output', expectOutputJSON);
});
