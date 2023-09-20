import { expect, test } from '@oclif/test';

import {
  aliceAccountName,
  contractArgument,
  contractArgumentSchema,
  contractProjectMetadata,
  dummyExecuteTransaction,
} from '../../dummies';
import { AccountsStubs, ConfigStubs, FilesystemStubs, SigningArchwayClientStubs } from '../../stubs';

describe('contracts execute', () => {
  const contractName = contractProjectMetadata.name;

  const accountsStubs = new AccountsStubs();
  const configStubs = new ConfigStubs();
  const filesystemStubs = new FilesystemStubs();
  const signingArchwayClientStubs = new SigningArchwayClientStubs();

  before(() => {
    accountsStubs.init();
    configStubs.init();
    configStubs.assertIsValidWorkspace();
    filesystemStubs.readFile(contractArgumentSchema);
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
    .command(['contracts execute', contractName, `--args=${contractArgument}`, `--from=${aliceAccountName}`])
    .it('Executes a transaction in a smart contract', ctx => {
      expect(ctx.stdout).to.contain('Executed contract');
      expect(ctx.stdout).to.contain(contractName);
      expect(ctx.stdout).to.contain('Transaction:');
      expect(ctx.stdout).to.contain(dummyExecuteTransaction.transactionHash);
    });

  test
    .stdout()
    .command(['contracts execute', contractName, `--args=${contractArgument}`, `--from=${aliceAccountName}`, '--json'])
    .it('Prints json output', ctx => {
      expect(ctx.stdout).to.not.contain('Executed contract');
      expect(ctx.stdout).to.contain(dummyExecuteTransaction.transactionHash);
      expect(ctx.stdout).to.contain(dummyExecuteTransaction.gasWanted);
      expect(ctx.stdout).to.contain(dummyExecuteTransaction.gasUsed);
    });

  test
    .stdout()
    .stderr()
    .command(['contracts execute', 'thisDoesntExist', `--args=${contractArgument}`, `--from=${aliceAccountName}`])
    .catch(/(Contract).*(not found)/)
    .it('fails on invalid contract');

  test
    .stdout()
    .stderr()
    .command(['contracts execute', contractName, '--args="{}"', `--from=${aliceAccountName}`])
    .catch(/(Failed to execute).*(does not match the schema)/)
    .it('fails on invalid query');

  test
    .stdout()
    .command(['contracts execute', contractName, '--args="{}"', `--from=${aliceAccountName}`, '--skip-validation'])
    .it("Skips validation of args and doesn't fail", ctx => {
      expect(ctx.stdout).to.contain(dummyExecuteTransaction.transactionHash);
    });
});
