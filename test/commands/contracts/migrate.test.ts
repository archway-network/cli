import { expect, test } from '@oclif/test';

import {
  aliceAccountName,
  contractArgument,
  contractArgumentSchema,
  contractProjectMetadata,
  dummyMigrateTransaction,
  instantiateDeployment,
} from '../../dummies';

import { AccountsStubs, ConfigStubs, FilesystemStubs, SigningArchwayClientStubs } from '../../stubs';

describe('contracts migrate', () => {
  const contractName = contractProjectMetadata.name;
  const codeId = instantiateDeployment.wasm.codeId;

  const accountsStubs = new AccountsStubs();
  const configStubs = new ConfigStubs();
  const filesystemStubs = new FilesystemStubs();
  const signingArchwayClientStubs = new SigningArchwayClientStubs();

  before(() => {
    accountsStubs.init();
    configStubs.init();
    configStubs.assertIsValidWorkspace();
    filesystemStubs.readFile(contractArgumentSchema);
    filesystemStubs.writeFile();
    signingArchwayClientStubs.connectWithSigner();
  });

  after(() => {
    accountsStubs.restoreAll();
    configStubs.restoreAll();
    filesystemStubs.restoreAll();
    signingArchwayClientStubs.restoreAll();
  });

  test
    .stdout()
    .command(['contracts migrate', contractName, `--args=${contractArgument}`, `--code=${codeId}`, `--from=${aliceAccountName}`])
    .it('Migrates the smart contract', ctx => {
      expect(ctx.stdout).to.contain('migrated');
      expect(ctx.stdout).to.contain(contractProjectMetadata.label);
      expect(ctx.stdout).to.contain('Transaction:');
      expect(ctx.stdout).to.contain(dummyMigrateTransaction.transactionHash);
    });

  test
    .stdout()
    .command(['contracts migrate', contractName, `--args=${contractArgument}`, `--code=${codeId}`, `--from=${aliceAccountName}`, '--json'])
    .it('Prints json output', ctx => {
      expect(ctx.stdout).to.not.contain('migrated');
      expect(ctx.stdout).to.contain(dummyMigrateTransaction.transactionHash);
      expect(ctx.stdout).to.contain(dummyMigrateTransaction.gasUsed);
    });

  test
    .stdout()
    .stderr()
    .command(['contracts migrate', 'thisDoesntExist', `--args=${contractArgument}`, `--code=${codeId}`, `--from=${aliceAccountName}`])
    .catch(/(Contract).*(not found)/)
    .it('fails on invalid contract');

  test
    .stdout()
    .stderr()
    .command(['contracts migrate', contractName, '--args={}', `--code=${codeId}`, `--from=${aliceAccountName}`])
    .catch(/(Failed to migrate).*(do not match the schema)/)
    .it('fails on invalid arguments');

  test
    .stdout()
    .command(['contracts migrate', contractName, '--args={}', `--code=${codeId}`, `--from=${aliceAccountName}`, '--no-validation'])
    .it("Skips validation of args and doesn't fail", ctx => {
      expect(ctx.stdout).to.contain(dummyMigrateTransaction.transactionHash);
    });
});
