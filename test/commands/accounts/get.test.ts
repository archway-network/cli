import { expect, test } from '@oclif/test';

import { aliceAccountName, aliceAddress, alicePublicKey } from '../../dummies';
import { AccountsStubs } from '../../stubs';

describe('accounts get', () => {
  const accountsStubs = new AccountsStubs();

  before(() => {
    accountsStubs.init();
  });
  after(() => {
    accountsStubs.restoreAll();
  });

  test
    .stdout()
    .command(['accounts get', aliceAccountName])
    .it('displays the account info', ctx => {
      expect(ctx.stdout).to.contain(aliceAccountName);
      expect(ctx.stdout).to.contain(aliceAddress);
      expect(ctx.stdout).to.contain(alicePublicKey.algo);
      expect(ctx.stdout).to.contain(alicePublicKey.key);
    });

  test
    .stdout()
    .command(['accounts get', aliceAccountName, '--address'])
    .it('displays the address only', ctx => {
      expect(ctx.stdout).to.not.contain(aliceAccountName);
      expect(ctx.stdout).to.contain(aliceAddress);
      expect(ctx.stdout).to.not.contain(alicePublicKey.algo);
      expect(ctx.stdout).to.not.contain(alicePublicKey.key);
    });

  test
    .stdout()
    .stderr()
    .command(['accounts get', 'thisDoesntExist'])
    .catch(/(Account).*(not found)/)
    .it('fails on invalid account');
});
