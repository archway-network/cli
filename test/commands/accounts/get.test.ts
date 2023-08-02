import { expect, test } from '@oclif/test';
import sinon, { SinonStub } from 'sinon';
import keyring from '@archwayhq/keyring-go';

import { aliceAddress, aliceStoreEntry, aliceAccountName, alicePublicKey, aliceStoredAccount } from '../../dummies/accounts';

describe('accounts get', () => {
  let keyringGetStub: SinonStub;
  let keyringListStub: SinonStub;
  before(() => {
    keyringGetStub = sinon.stub(keyring.OsStore, 'get').callsFake(() => aliceStoredAccount);
    keyringListStub = sinon.stub(keyring.OsStore, 'list').callsFake(() => [aliceStoreEntry]);
  });
  after(() => {
    keyringGetStub.restore();
    keyringListStub.restore();
  });

  test
    .stdout()
    .command(['accounts get', aliceAccountName])
    .it('displays the account info', ctx => {
      expect(ctx.stdout).to.contain(aliceAccountName);
      expect(ctx.stdout).to.contain(aliceAddress);
      expect(ctx.stdout).to.contain(alicePublicKey['@type']);
      expect(ctx.stdout).to.contain(alicePublicKey.key);
    });

  test
    .stdout()
    .command(['accounts get', aliceAccountName, '--address'])
    .it('displays the address only', ctx => {
      expect(ctx.stdout).to.not.contain(aliceAccountName);
      expect(ctx.stdout).to.contain(aliceAddress);
      expect(ctx.stdout).to.not.contain(alicePublicKey['@type']);
      expect(ctx.stdout).to.not.contain(alicePublicKey.key);
    });
});
