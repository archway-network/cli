import { expect, test } from '@oclif/test';
import prompts from 'prompts';

import { aliceAccountName } from '../../dummies';
import { AccountsStubs } from '../../stubs';

describe('accounts remove', () => {
  const accountsStubs = new AccountsStubs();

  before(() => {
    accountsStubs.init();
  });

  after(() => {
    accountsStubs.restoreAll();
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
      .stderr()
      .command(['accounts remove', aliceAccountName])
      .it("doesn't delete the account", ctx => {
        expect(ctx.stderr).to.contain('Operation canceled');
        expect(ctx.stdout).to.not.contain('deleted');
      });
  });

  test
    .stdout()
    .stderr()
    .command(['accounts remove', 'notExistentAccount'])
    .catch(/(Account).*(not found)/)
    .it('fails on invalid account to delete');
});
