import { expect, test } from '@oclif/test';

import { aliceAccountName, contractProjectMetadata, dummyMigrateTransaction, instantiateDeployment } from '../../dummies';

import { AccountsStubs, ConfigStubs, SigningArchwayClientStubs } from '../../stubs';

describe('contracts migrate', () => {
  const contractName = contractProjectMetadata.name;
  const codeId = instantiateDeployment.wasm.codeId;

  const accountsStubs = new AccountsStubs();
  const configStubs = new ConfigStubs();
  const signingArchwayClientStubs = new SigningArchwayClientStubs();

  before(() => {
    accountsStubs.init();
    configStubs.init();
    configStubs.assertIsValidWorkspace();
    signingArchwayClientStubs.connectWithSigner();
  });

  after(() => {
    accountsStubs.restoreAll();
    configStubs.restoreAll();
    signingArchwayClientStubs.restoreAll();
  });

  test
    .stdout()
    .command(['contracts migrate', contractName, `--code=${codeId}`, `--from=${aliceAccountName}`])
    .it('Migrates the smart contract', ctx => {
      expect(ctx.stdout).to.contain('migrated');
      expect(ctx.stdout).to.contain(contractProjectMetadata.label);
      expect(ctx.stdout).to.contain('Transaction:');
      expect(ctx.stdout).to.contain(dummyMigrateTransaction.transactionHash);
    });

  test
    .stdout()
    .command(['contracts migrate', contractName, `--code=${codeId}`, `--from=${aliceAccountName}`, '--json'])
    .it('Prints json output', ctx => {
      expect(ctx.stdout).to.not.contain('migrated');
      expect(ctx.stdout).to.contain(dummyMigrateTransaction.transactionHash);
      expect(ctx.stdout).to.contain(dummyMigrateTransaction.gasUsed);
    });

  test
    .stdout()
    .stderr()
    .command(['contracts migrate', 'thisDoesntExist', `--code=${codeId}`, `--from=${aliceAccountName}`])
    .catch(/(Contract).*(not found)/)
    .it('fails on invalid contract');
});
