import { expect, test } from '@oclif/test';
import prompts from 'prompts';
import sinon, { SinonStub } from 'sinon';
import keyring from '@archwayhq/keyring-go';

import { aliceStoreEntry, aliceAccountName, aliceStoredAccount } from '../../dummies';

describe('accounts remove', () => {
  let keyringGetStub: SinonStub;
  let keyringListStub: SinonStub;
  let keyringRemoveStub: SinonStub;
  before(() => {
    keyringGetStub = sinon.stub(keyring.OsStore, 'get').callsFake(() => aliceStoredAccount);
    keyringListStub = sinon.stub(keyring.OsStore, 'list').callsFake(() => [aliceStoreEntry]);
    keyringRemoveStub = sinon.stub(keyring.OsStore, 'remove');
  });
  after(() => {
    keyringGetStub.restore();
    keyringListStub.restore();
    keyringRemoveStub.restore();
  });

  describe('confirm deletion prompt', () => {
    before(() => {
      prompts.inject([true]);
    });
    test
      .stdout()
      .command(['accounts remove', aliceAccountName])
      .it('successfully deletes the account', ctx => {
        expect(ctx.stdout).to.contain(aliceAccountName);
        expect(ctx.stdout).to.contain('deleted');
      });
  });

  describe('cancel delete in prompt', () => {
    before(() => {
      prompts.inject([false]);
    });
    test
      .stdout()
      .command(['accounts remove', aliceAccountName])
      .it("doesn't delete the account", ctx => {
        expect(ctx.stdout).to.contain('Operation canceled');
        expect(ctx.stdout).to.not.contain('deleted');
      });
  });
});
