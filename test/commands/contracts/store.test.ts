import { expect, test } from '@oclif/test';

import { aliceAccountName, contractProjectMetadata, dummyStoreTransaction } from '../../dummies';
import { AccountsStubs, ConfigStubs, FilesystemStubs, SigningArchwayClientStubs } from '../../stubs';

describe('contracts store', () => {
  const contractName = contractProjectMetadata.name;

  const accountsStubs = new AccountsStubs();
  const configStubs = new ConfigStubs();
  const filesystemStubs = new FilesystemStubs();
  const signingArchwayClientStubs = new SigningArchwayClientStubs();

  before(() => {
    accountsStubs.init();
    configStubs.init();
    configStubs.assertIsValidWorkspace();
    filesystemStubs.readFile();
    signingArchwayClientStubs.connectWithSigner();
  });

  after(() => {
    accountsStubs.restoreAll();
    configStubs.restoreAll();
    filesystemStubs.restoreAll();
    signingArchwayClientStubs.restoreAll();
  });

  describe('Stores the smart contract', () => {
    test
      .stdout()
      .command(['contracts store', contractName, `--from=${aliceAccountName}`])
      .it('Uploads wasm file', ctx => {
        expect(ctx.stdout).to.contain('uploaded');
        expect(ctx.stdout).to.contain(dummyStoreTransaction.codeId);
        expect(ctx.stdout).to.contain('Transaction:');
        expect(ctx.stdout).to.contain(dummyStoreTransaction.transactionHash);
      });
  });

  describe('Prints json output', () => {
    test
      .stdout()
      .command(['contracts store', contractName, `--from=${aliceAccountName}`, '--json'])
      .it('Uploads wasm file', ctx => {
        expect(ctx.stdout).to.not.contain('uploaded');
        expect(ctx.stdout).to.contain(dummyStoreTransaction.transactionHash);
        expect(ctx.stdout).to.contain(dummyStoreTransaction.codeId);
        expect(ctx.stdout).to.contain(dummyStoreTransaction.originalSize);
        expect(ctx.stdout).to.contain(dummyStoreTransaction.checksum);
        expect(ctx.stdout).to.contain(dummyStoreTransaction.gasUsed);
      });
  });

  test
    .stdout()
    .stderr()
    .command(['contracts store', 'thisDoesntExist', `--from=${aliceAccountName}`])
    .catch(/(Contract).*(not found)/)
    .it('fails on invalid contract');
});
