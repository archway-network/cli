import { expect, test } from '@oclif/test';
import sinon, { SinonStub } from 'sinon';
import keyring from '@archwayhq/keyring-go';

import { aliceAddress, aliceStoreEntry, aliceAccountName, bobStoreEntry, bobAccountName, bobAddress } from '../../dummies/accounts';

describe('accounts list', () => {
  let keyringListStub: SinonStub;
  before(() => {
    keyringListStub = sinon.stub(keyring.OsStore, 'list').callsFake(() => [aliceStoreEntry, bobStoreEntry]);
  });
  after(() => {
    keyringListStub.restore();
  });

  test
    .stdout()
    .command(['accounts list'])
    .it('displays all the accounts', ctx => {
      expect(ctx.stdout).to.contain(aliceAccountName);
      expect(ctx.stdout).to.contain(aliceAddress);
      expect(ctx.stdout).to.contain(bobAccountName);
      expect(ctx.stdout).to.contain(bobAddress);
    });
});
