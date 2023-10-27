import { expect, test } from '@oclif/test';

import { expectOutputJSON } from '../../helpers/expect';
import { aliceAddress, dummyRewardsQueryResult } from '../../dummies';
import { AccountsStubs, ArchwayClientStubs, ConfigStubs } from '../../stubs';

describe('rewards query', () => {
  const accountsStubs = new AccountsStubs();
  const configStubs = new ConfigStubs();
  const archwayClientStubs = new ArchwayClientStubs();

  before(() => {
    accountsStubs.init();
    configStubs.init();
    archwayClientStubs.connect();
  });

  after(() => {
    accountsStubs.restoreAll();
    configStubs.restoreAll();
    archwayClientStubs.restoreAll();
  });

  test
    .stdout()
    .command(['rewards query', aliceAddress])
    .it('Query outstanding rewards balance of a contract', ctx => {
      expect(ctx.stdout).to.contain('Outstanding rewards for');
      expect(ctx.stdout).to.contain(aliceAddress);
      expect(ctx.stdout).to.contain(dummyRewardsQueryResult.totalRewards[0].amount);
      expect(ctx.stdout).to.contain(dummyRewardsQueryResult.totalRewards[0].denom);
    });

  test
    .stdout()
    .env({ ARCHWAY_SKIP_VERSION_CHECK: 'true' })
    .command(['rewards query', aliceAddress, '--json'])
    .it('Prints json output', expectOutputJSON);

  test
    .stdout()
    .stderr()
    .command(['rewards query', 'thisDoesntExist'])
    .catch(/(Address).*(doesn't have a valid format)/)
    .it('fails on invalid contract');
});
