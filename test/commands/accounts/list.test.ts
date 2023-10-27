import { expect, test } from '@oclif/test';

import { aliceAddress, aliceAccountName, bobAccountName, bobAddress } from '../../dummies';
import { AccountsStubs } from '../../stubs';

describe('accounts list', () => {
  const accountsStubs = new AccountsStubs();

  describe('success', () => {
    before(() => {
      accountsStubs.init();
    });

    after(() => {
      accountsStubs.restoreAll();
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

  describe('empty list', () => {
    before(() => {
      accountsStubs.init(undefined, undefined, []);
    });

    after(() => {
      accountsStubs.restoreAll();
    });

    test
      .stdout()
      .command(['accounts list'])
      .it('displays no accounts message', ctx => {
        expect(ctx.stdout).to.not.contain(aliceAccountName);
        expect(ctx.stdout).to.not.contain(aliceAddress);
        expect(ctx.stdout).to.contain('No accounts found');
      });
  });
});
