import { expect, test } from '@oclif/test';
import prompts from 'prompts';

import { aliceAccountName, dummyAmount, dummyAmountString, bobAddress, aliceAddress } from '../../dummies';
import { AccountsStubs, ConfigStubs, SigningArchwayClientStubs, StargateClientStubs } from '../../stubs';

describe('accounts balances', () => {
  const nonExistentAccount = 'thisDoesntExist';

  const accountsStubs = new AccountsStubs();
  const configStubs = new ConfigStubs();
  const stargateClientStubs = new StargateClientStubs();
  const signingArchwayClientStubs = new SigningArchwayClientStubs();

  before(() => {
    accountsStubs.init();
    configStubs.init();
  });

  after(() => {
    accountsStubs.restoreAll();
    configStubs.restoreAll();
  });

  describe('accounts balances get', () => {
    before(() => {
      stargateClientStubs.connect();
    });

    after(() => {
      stargateClientStubs.restoreAll();
    });

    test
      .stdout()
      .command(['accounts balances get', aliceAccountName])
      .it('displays the balance of an account by name', ctx => {
        expect(ctx.stdout).to.contain(aliceAccountName);
        expect(ctx.stdout).to.contain(aliceAddress);
        expect(ctx.stdout).to.contain(dummyAmount.amount);
        expect(ctx.stdout).to.contain(dummyAmount.denom);
      });

    test
      .stdout()
      .command(['accounts balances get', bobAddress])
      .it('displays the balance of a valid address', ctx => {
        expect(ctx.stdout).to.contain(bobAddress);
        expect(ctx.stdout).to.contain(dummyAmount.amount);
        expect(ctx.stdout).to.contain(dummyAmount.denom);
      });

    test
      .stdout()
      .stderr()
      .command(['accounts balances get', nonExistentAccount])
      .catch(/(Address).*(doesn't have a valid format)/)
      .it('fails on invalid address format');
  });

  describe('accounts balances send', () => {
    before(() => {
      prompts.inject([true]);
      signingArchwayClientStubs.connectWithSigner();
    });

    after(() => {
      signingArchwayClientStubs.restoreAll();
    });

    test
      .stdout()
      .command(['accounts balances send', dummyAmountString, `--from=${aliceAccountName}`, `--to=${bobAddress}`])
      .it('sends tokens from an account', ctx => {
        expect(ctx.stdout).to.contain('Sent');
        expect(ctx.stdout).to.contain(aliceAccountName);
        expect(ctx.stdout).to.contain(dummyAmountString);
        expect(ctx.stdout).to.contain(bobAddress);
      });

    test
      .stdout()
      .stderr()
      .command(['accounts balances send', dummyAmountString, `--from=${aliceAccountName}`, `--to=${nonExistentAccount}`])
      .catch(/(Address).*(doesn't have a valid format)/)
      .it('fails on invalid receiver account');

    test
      .stdout()
      .stderr()
      .command(['accounts balances send', dummyAmountString, `--from=${nonExistentAccount}`, `--to=${bobAddress}`])
      .catch(/(Account).*(not found)/)
      .it('fails on invalid sender account');
  });
});
