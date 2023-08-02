import { expect, test } from '@oclif/test';

import Accounts from '../../../src/commands/accounts';

describe('accounts help', () => {
  test
    .stdout()
    .command(['accounts'])
    .it('displays command info', ctx => {
      expect(ctx.stdout).to.contain(Accounts.summary);
    });
});
