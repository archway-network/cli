import { expect, test } from '@oclif/test';
import sinon, { SinonStub } from 'sinon';
import keyring from '@archwayhq/keyring-go';

import { aliceAccountName, aliceMnemonic } from '../../dummies';

describe('accounts new', () => {
  let keyringSetStub: SinonStub;
  let keyringListStub: SinonStub;
  before(() => {
    keyringSetStub = sinon.stub(keyring.OsStore, 'set');
    keyringListStub = sinon.stub(keyring.OsStore, 'list').callsFake(() => []);
  });
  after(() => {
    keyringSetStub.restore();
    keyringListStub.restore();
  });

  test
    .stdout()
    .command(['accounts new', aliceAccountName])
    .it('creates a new account generating a new mnemonic', ctx => {
      expect(ctx.stdout).to.contain(aliceAccountName);
      expect(ctx.stdout).to.contain('successfully created');
      expect(ctx.stdout).to.contain('Mnemonic:');
      expect(ctx.stdout).to.not.contain(aliceMnemonic);
    });

  test
    .stdout()
    .command(['accounts new', aliceAccountName, `--mnemonic=${aliceMnemonic}`])
    .it('creates a new account using mnemonic passed in flag', ctx => {
      expect(ctx.stdout).to.contain(aliceAccountName);
      expect(ctx.stdout).to.contain('successfully created');
      expect(ctx.stdout).to.contain('Mnemonic:');
      expect(ctx.stdout).to.contain(aliceMnemonic);
    });
});
