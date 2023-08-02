import { expect, test } from '@oclif/test';
import fs from 'node:fs/promises';
import sinon, { SinonStub } from 'sinon';
import keyring from '@archwayhq/keyring-go';
import { SigningArchwayClient } from '@archwayhq/arch3.js';

import { Cargo } from '../../../src/domain';
import {
  aliceAddress,
  aliceStoreEntry,
  aliceStoredAccount,
  configString,
  contractProjectMetadata,
  dummyRewardsWithdrawResult,
} from '../../dummies';
import * as FilesystemUtils from '../../../src/utils/filesystem';

describe('rewards withdraw', () => {
  let readStub: SinonStub;
  let writeStub: SinonStub;
  let mkdirStub: SinonStub;
  let readSubDirStub: SinonStub;
  let keyringGetStub: SinonStub;
  let keyringListStub: SinonStub;
  let metadataStub: SinonStub;
  let archwayClientStub: SinonStub;
  before(() => {
    readStub = sinon.stub(fs, 'readFile').callsFake(async () => configString);
    writeStub = sinon.stub(fs, 'writeFile');
    mkdirStub = sinon.stub(fs, 'mkdir');
    readSubDirStub = sinon.stub(FilesystemUtils, 'readSubDirectories').callsFake(async () => [contractProjectMetadata.name]);
    keyringGetStub = sinon.stub(keyring.OsStore, 'get').callsFake(() => aliceStoredAccount);
    keyringListStub = sinon.stub(keyring.OsStore, 'list').callsFake(() => [aliceStoreEntry]);
    metadataStub = sinon.stub(Cargo.prototype, 'projectMetadata').callsFake(async () => contractProjectMetadata);
    archwayClientStub = sinon
      .stub(SigningArchwayClient, 'connectWithSigner')
      .callsFake(async () => ({ withdrawContractRewards: async () => dummyRewardsWithdrawResult } as any));
  });
  after(() => {
    readStub.restore();
    writeStub.restore();
    mkdirStub.restore();
    readSubDirStub.restore();
    keyringGetStub.restore();
    keyringListStub.restore();
    metadataStub.restore();
    archwayClientStub.restore();
  });

  test
    .stdout()
    .command(['rewards withdraw', `--from=${aliceAddress}`])
    .it('Query outstanding rewards balance of a contract', ctx => {
      expect(ctx.stdout).to.contain('Successfully claimed the following rewards');
      expect(ctx.stdout).to.contain(dummyRewardsWithdrawResult.rewards[0].amount);
      expect(ctx.stdout).to.contain(dummyRewardsWithdrawResult.rewards[0].denom);
    });
});
