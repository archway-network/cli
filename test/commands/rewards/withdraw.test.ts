import { expect, test } from '@oclif/test';

import { aliceAddress, dummyRewardsWithdrawResult } from '../../dummies';
import { AccountsStubs, ConfigStubs, SigningArchwayClientStubs } from '../../stubs';

describe('rewards withdraw', () => {
  const accountsStubs = new AccountsStubs();
  const configStubs = new ConfigStubs();
  const signingArchwayClientStubs = new SigningArchwayClientStubs();

  before(() => {
    accountsStubs.init();
    configStubs.init();
    signingArchwayClientStubs.connectWithSigner();
  });

  after(() => {
    accountsStubs.restoreAll();
    configStubs.restoreAll();
    signingArchwayClientStubs.restoreAll();
  });

  test
    .stdout()
    .command(['rewards withdraw', `--from=${aliceAddress}`])
    .it('Query outstanding rewards balance of a contract', ctx => {
      expect(ctx.stdout).to.contain('Successfully claimed the following rewards');
      expect(ctx.stdout).to.contain(dummyRewardsWithdrawResult.rewards[0].amount);
      expect(ctx.stdout).to.contain(dummyRewardsWithdrawResult.rewards[0].denom);
    });

  test
    .stdout()
    .stderr()
    .command(['rewards withdraw', '--from=invalidAddress'])
    .catch(/(Account).*(not found)/)
    .it('fails on invalid contract');
});
