import { expect, test } from '@oclif/test';
import fs from 'node:fs/promises';
import sinon, { SinonStub } from 'sinon';
import keyring from '@archwayhq/keyring-go';
import { ArchwayClient } from '@archwayhq/arch3.js';

import { Cargo } from '../../../src/domain';
import {
  aliceAccountName,
  aliceAddress,
  aliceStoreEntry,
  aliceStoredAccount,
  configString,
  contractProjectMetadata,
  dummyRewardsQueryResult,
} from '../../dummies';
import * as FilesystemUtils from '../../../src/utils/filesystem';

import { expectOutputJSON } from '../../helpers/expect';

describe('rewards query', () => {
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
      .stub(ArchwayClient, 'connect')
      .callsFake(async () => ({ getOutstandingRewards: async () => dummyRewardsQueryResult } as any));
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
    .command(['rewards query', aliceAddress])
    .it('Query outstanding rewards balance of a contract', ctx => {
      expect(ctx.stdout).to.contain('Outstanding rewards for');
      expect(ctx.stdout).to.contain(aliceAddress);
      expect(ctx.stdout).to.contain(dummyRewardsQueryResult.totalRewards[0].amount);
      expect(ctx.stdout).to.contain(dummyRewardsQueryResult.totalRewards[0].denom);
    });

  test.stdout().command(['rewards query', aliceAccountName, '--json']).it('Prints json output', expectOutputJSON);
});
