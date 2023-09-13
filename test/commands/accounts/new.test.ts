import { expect, test } from '@oclif/test';

import { aliceAccountName, aliceAddress, aliceMnemonic } from '../../dummies';
import { AccountsStubs } from '../../stubs';

describe('accounts new', () => {
  const accountsStubs = new AccountsStubs();

  describe('success', () => {
    before(() => {
      accountsStubs.init(undefined, undefined, []);
    });

    after(() => {
      accountsStubs.restoreAll();
    });

    test
      .stdout()
      .command(['accounts new', aliceAccountName])
      .it('creates a new account generating a new mnemonic', ctx => {
        expect(ctx.stdout).to.contain(aliceAccountName);
        expect(ctx.stdout).to.contain('successfully created');
        expect(ctx.stdout).to.contain('Mnemonic:');
        expect(ctx.stdout).to.not.contain(aliceMnemonic);
      });

    test
      .stdout()
      .command(['accounts new', aliceAccountName, `${aliceMnemonic}`, '--recover'])
      .it('creates a new account using mnemonic passed in flag', ctx => {
        expect(ctx.stdout).to.contain(aliceAccountName);
        expect(ctx.stdout).to.contain(aliceAddress);
        expect(ctx.stdout).to.contain('successfully created');
        expect(ctx.stdout).to.contain('Mnemonic:');
        expect(ctx.stdout).to.contain(aliceMnemonic);
      });

    test
      .stdout()
      .command(['accounts new', aliceAccountName, `${aliceMnemonic}`, '--recover', '--hd-path=2'])
      .it('creates a new account using mnemonic and with a different hd path', ctx => {
        expect(ctx.stdout).to.contain(aliceAccountName);
        expect(ctx.stdout).to.not.contain(aliceAddress);
        expect(ctx.stdout).to.contain('successfully created');
        expect(ctx.stdout).to.contain('Mnemonic:');
        expect(ctx.stdout).to.contain(aliceMnemonic);
      });
  });

  describe('failure', () => {
    before(() => {
      accountsStubs.init();
    });

    after(() => {
      accountsStubs.restoreAll();
    });

    test
      .stdout()
      .stderr()
      .command(['accounts new', aliceAccountName])
      .catch(/(Account).*(already exists)/)
      .it('fails on existing sender account');
  });
});
