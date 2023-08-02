import { expect, test } from '@oclif/test';

import Config from '../../../src/commands/config';

const expectHelp = (ctx: any) => {
  expect(ctx.stdout).to.contain('Description:');
  expect(ctx.stdout).to.contain('USAGE');
  expect(ctx.stdout).to.contain('TOPICS');
  expect(ctx.stdout).to.contain('Available commands:');
  expect(ctx.stdout).to.contain(Config.summary);
};

describe('config help', () => {
  test.stdout().command(['config']).it('shows the config help when no other arguments', expectHelp);

  test.stdout().command(['config', '--help']).it('shows the config help when the flag is set', expectHelp);
});
