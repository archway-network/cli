import { expect, test } from '@oclif/test';
import sinon, { SinonStub } from 'sinon';
import fs from 'node:fs/promises';

import { expectOutputJSON } from '../../helpers/expect';
import { configString } from '../../dummies/configFile';

describe('config show', () => {
  let readStub: SinonStub;
  let readdirStub: SinonStub;

  before(() => {
    readStub = sinon.stub(fs, 'readFile').callsFake(async () => configString);
    readdirStub = sinon.stub(fs, 'readdir').callsFake(async () => []);
  });

  after(() => {
    readStub.restore();
    readdirStub.restore();
  });

  test
    .stdout()
    .command(['config show'])
    .it('shows the config info', ctx => {
      expect(ctx.stdout).to.contain('Project: ');
      expect(ctx.stdout).to.contain('Selected chain: ');
    });

  test.stdout().command(['config show', '--json']).it('shows a JSON representation of the config info', expectOutputJSON);
});
