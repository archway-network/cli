import { expect, test } from '@oclif/test';
import { inject } from 'prompts';

import { aliceAccountName, aliceAddress } from '../../dummies';
import { AccountsStubs } from '../../stubs';

describe('accounts export', () => {
  const accountsStubs = new AccountsStubs();

  before(() => {
    accountsStubs.init();
  });
  after(() => {
    accountsStubs.restoreAll();
  });

  describe('confirm export prompt', () => {
    before(() => {
      inject([true]);
    });

    test
      .stdout()
      .stderr()
      .command(['accounts export', aliceAccountName])
      .it('displays the account private key', ctx => {
        expect(ctx.stderr).to.contain(aliceAccountName);
        expect(ctx.stderr).to.contain(aliceAddress);
        expect(ctx.stdout).to.contain('Private key:');
        expect(ctx.stdout).to.match(/[\dA-Fa-f]+/);
      });
  });

  describe('cancel export', () => {
    before(() => {
      inject([false]);
    });

    test
      .stdout()
      .stderr()
      .command(['accounts export', aliceAccountName])
      .it('does not export the private key', ctx => {
        expect(ctx.stderr).to.contain(aliceAccountName);
        expect(ctx.stderr).to.contain(aliceAddress);
        expect(ctx.stdout).not.to.contain('Private key:');
        expect(ctx.stdout).not.to.match(/[\dA-Fa-f]+/);
      });
  });

  test
    .stdout()
    .stderr()
    .command(['accounts export', aliceAccountName, '--no-confirm'])
    .it('do not ask for confirmation to export the private key', ctx => {
      expect(ctx.stderr).to.contain(aliceAccountName);
      expect(ctx.stderr).to.contain(aliceAddress);
      expect(ctx.stdout).to.contain('Private key:');
      expect(ctx.stdout).to.match(/[\dA-Fa-f]+/);
    });

  test
    .stdout()
    .stderr()
    .command(['accounts export', 'thisDoesntExist'])
    .catch(/(Account).*(not found)/)
    .it('fails on invalid account');
});
