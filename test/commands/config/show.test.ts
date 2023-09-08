import { expect, test } from '@oclif/test';

import { expectOutputJSON } from '../../helpers';
import { ConfigStubs } from '../../stubs';
import { configFile } from '../../dummies';

describe('config show', () => {
  const configStubs = new ConfigStubs();

  before(() => {
    configStubs.init();
  });

  after(() => {
    configStubs.restoreAll();
  });

  test
    .stdout()
    .command(['config show'])
    .it('shows the config info', ctx => {
      expect(ctx.stdout).to.contain(configFile['chain-id']);
      expect(ctx.stdout).to.contain(configFile['contracts-path']);
      expect(ctx.stdout).to.contain(configFile['keyring-backend']);
    });

  test
    .stdout()
    .env({ ARCHWAY_SKIP_VERSION_CHECK: 'true' })
    .command(['config show', '--json'])
    .it('shows a JSON representation of the config info', expectOutputJSON);
});
