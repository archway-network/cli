import { expect, test } from '@oclif/test';

import { aliceAccountName, contractProjectMetadata, dummyQueryResult, contractArgument, contractArgumentSchema } from '../../../dummies';
import { expectOutputJSON } from '../../../helpers/expect';
import { AccountsStubs, ConfigStubs, FilesystemStubs, SigningArchwayClientStubs } from '../../../stubs';

describe('contracts query smart', () => {
  const contractName = contractProjectMetadata.name;

  const accountsStubs = new AccountsStubs();
  const configStubs = new ConfigStubs();
  const signingArchwayClientStubs = new SigningArchwayClientStubs();
  const filesystemStubs = new FilesystemStubs();

  before(() => {
    accountsStubs.init();
    configStubs.init();
    configStubs.assertIsValidWorkspace();
    signingArchwayClientStubs.connectWithSigner();
    filesystemStubs.readFile(contractArgumentSchema);
  });

  after(() => {
    accountsStubs.restoreAll();
    configStubs.restoreAll();
    signingArchwayClientStubs.restoreAll();
    filesystemStubs.restoreAll();
  });

  test
    .stdout()
    .command(['contracts query smart', contractName, `--args=${contractArgument}`, `--from=${aliceAccountName}`])
    .it('Queries a contract', ctx => {
      expect(ctx.stdout).to.contain(dummyQueryResult.msg);
    });

  test
    .stdout()
    .command(['contracts query smart', contractName, `--args=${contractArgument}`, `--from=${aliceAccountName}`])
    .it('Query result is JSON formatted', expectOutputJSON);

  test
    .stdout()
    .stderr()
    .command(['contracts query smart', 'thisDoesntExist', `--args=${contractArgument}`, `--from=${aliceAccountName}`])
    .catch(/(Contract).*(not found)/)
    .it('fails on invalid contract');

  test
    .stdout()
    .stderr()
    .command(['contracts query smart', contractName, '--args={}', `--from=${aliceAccountName}`])
    .catch(/(Failed to query).*(does not match the schema)/)
    .it('fails on invalid arguments');
});
