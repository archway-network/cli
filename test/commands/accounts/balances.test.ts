import { expect, test } from '@oclif/test';
import prompts from 'prompts';
import fs from 'node:fs/promises';
import sinon, { SinonStub } from 'sinon';
import keyring from '@archwayhq/keyring-go';
import { StargateClient } from '@cosmjs/stargate';
import { SigningArchwayClient } from '@archwayhq/arch3.js';

import { configString, aliceStoreEntry, aliceAccountName, aliceStoredAccount, dummyAmount, dummyAmmountString, bobAddress } from '../../dummies';

describe('accounts balances', () => {
  let readStub: SinonStub;
  let keyringGetStub: SinonStub;
  let keyringListStub: SinonStub;
  before(() => {
    readStub = sinon.stub(fs, 'readFile').callsFake(async () => configString);
    keyringGetStub = sinon.stub(keyring.OsStore, 'get').callsFake(() => aliceStoredAccount);
    keyringListStub = sinon.stub(keyring.OsStore, 'list').callsFake(() => [aliceStoreEntry]);
  });
  after(() => {
    readStub.restore();
    keyringGetStub.restore();
    keyringListStub.restore();
  });

  describe('accounts balances get', () => {
    let stargateClientStub: SinonStub;
    before(() => {
      stargateClientStub = sinon
        .stub(StargateClient, 'connect')
        .callsFake(async () => ({ getAllBalances: async () => [dummyAmount] } as any));
    });
    after(() => {
      stargateClientStub.restore();
    });
    test
      .stdout()
      .command(['accounts balances get', aliceAccountName])
      .it('displays the accounts balance', ctx => {
        expect(ctx.stdout).to.contain(aliceAccountName);
        expect(ctx.stdout).to.contain(dummyAmount.amount);
        expect(ctx.stdout).to.contain(dummyAmount.denom);
      });
  });

  describe('accounts balances send', () => {
    let stargateClientStub: SinonStub;
    before(() => {
      prompts.inject([true]);
      stargateClientStub = sinon
        .stub(SigningArchwayClient, 'connectWithSigner')
        .callsFake(async () => ({ sendTokens: async () => true } as any));
    });
    after(() => {
      stargateClientStub.restore();
    });
    test
      .stdout()
      .command(['accounts balances send', dummyAmmountString, `--from=${aliceAccountName}`, `--to=${bobAddress}`])
      .it('sends tokens from an account', ctx => {
        expect(ctx.stdout).to.contain('Sent');
        expect(ctx.stdout).to.contain(aliceAccountName);
        expect(ctx.stdout).to.contain(dummyAmmountString);
        expect(ctx.stdout).to.contain(bobAddress);
      });
  });
});
