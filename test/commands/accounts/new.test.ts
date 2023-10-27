import { expect, test } from '@oclif/test';

import * as bip39 from 'bip39';
import sinon from 'sinon';

import { aliceAccountName, aliceAddress, aliceMnemonic } from '../../dummies';
import { AccountsStubs } from '../../stubs';

describe('accounts new', () => {
  const accountsStubs = new AccountsStubs();

  describe('success', () => {
    before(() => {
      accountsStubs.init(undefined, undefined, []);
      sinon.stub(bip39, 'generateMnemonic').returns(aliceMnemonic);
    });

    after(() => {
      accountsStubs.restoreAll();
    });

    test
      .stdout()
      .command(['accounts new', aliceAccountName])
      .it('creates a new account generating a new mnemonic', ctx => {
        expect(ctx.stdout).to.contain(aliceAccountName);
        expect(ctx.stdout).to.contain(aliceAddress);
        expect(ctx.stdout).to.contain('successfully created');
        expect(ctx.stdout).to.contain('Recovery phrase:');
        expect(ctx.stdout).to.contain(aliceMnemonic);
      });

    test
      .stdout()
      .command(['accounts new', aliceAccountName, `${aliceMnemonic}`, '--recover'])
      .it('creates a new account using mnemonic passed in flag', ctx => {
        expect(ctx.stdout).to.contain(aliceAccountName);
        expect(ctx.stdout).to.contain(aliceAddress);
        expect(ctx.stdout).to.contain('successfully created');
        expect(ctx.stdout).to.not.contain('Recovery phrase:');
        expect(ctx.stdout).to.not.contain(aliceMnemonic);
      });

    test
      .stdout()
      .command(['accounts new', aliceAccountName, `${aliceMnemonic}`, '--recover', '--hd-path=m/44\'/118\'/1\'/0/0'])
      .it('creates a new account using mnemonic and with a different hd path', ctx => {
        expect(ctx.stdout).to.contain(aliceAccountName);
        expect(ctx.stdout).not.to.contain(aliceAddress);
        expect(ctx.stdout).to.contain('successfully created');
        expect(ctx.stdout).to.not.contain('Recovery phrase:');
        expect(ctx.stdout).to.not.contain(aliceMnemonic);
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
