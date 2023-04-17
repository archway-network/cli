import { expect, test } from '@oclif/test';
import Contracts from '../../src/commands/contracts';

describe('contracts', () => {
  test
    .stdout()
    .command(['contracts'])
    .it('displays command info', ctx => {
      expect(ctx.stdout).to.contain(Contracts.summary);
    });
});
