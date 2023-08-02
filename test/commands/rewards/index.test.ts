import { expect, test } from '@oclif/test';

import Rewards from '../../../src/commands/rewards';

describe('rewards help', () => {
  test
    .stdout()
    .command(['rewards'])
    .it('displays command info', ctx => {
      expect(ctx.stdout).to.contain(Rewards.summary);
    });
});
