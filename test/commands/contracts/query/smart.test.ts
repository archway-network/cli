import { expect, test } from '@oclif/test';

import { contractProjectMetadata, dummyQueryResult, contractArgument, contractArgumentSchema } from '../../../dummies';
import { expectOutputJSON } from '../../../helpers/expect';
import { ArchwayClientStubs, ConfigStubs, FilesystemStubs } from '../../../stubs';

describe('contracts query smart', () => {
  const contractName = contractProjectMetadata.name;

  const configStubs = new ConfigStubs();
  const archwayClientStubs = new ArchwayClientStubs();
  const filesystemStubs = new FilesystemStubs();

  before(() => {
    configStubs.init();
    configStubs.assertIsValidWorkspace();
    archwayClientStubs.connect();
    filesystemStubs.readFile(contractArgumentSchema);
  });

  after(() => {
    configStubs.restoreAll();
    archwayClientStubs.restoreAll();
    filesystemStubs.restoreAll();
  });

  test
    .stdout()
    .command(['contracts query smart', contractName, `--args=${contractArgument}`])
    .it('Queries a contract', ctx => {
      expect(ctx.stdout).to.contain(dummyQueryResult.msg);
    });

  test
    .stdout()
    .env({ ARCHWAY_SKIP_VERSION_CHECK: 'true' })
    .command(['contracts query smart', contractName, `--args=${contractArgument}`])
    .it('Query result is JSON formatted', expectOutputJSON);

  test
    .stdout()
    .stderr()
    .command(['contracts query smart', 'thisDoesntExist', `--args=${contractArgument}`])
    .catch(/(Contract).*(not found)/)
    .it('fails on invalid contract');

  test
    .stdout()
    .stderr()
    .command(['contracts query smart', contractName, '--args={}'])
    .catch(/(Failed to query).*(does not match the schema)/)
    .it('fails on invalid arguments');

  test
    .stdout()
    .command(['contracts query smart', contractName, '--args={}', '--skip-validation'])
    .it("Skips validation of args and doesn't fail", ctx => {
      expect(ctx.stdout).to.contain(dummyQueryResult.msg);
    });
});
