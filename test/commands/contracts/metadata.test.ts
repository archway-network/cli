import { expect, test } from '@oclif/test';

import { aliceAccountName, aliceAddress, contractProjectMetadata, dummyMetadataTransaction } from '../../dummies';

import { AccountsStubs, ConfigStubs, FilesystemStubs, SigningArchwayClientStubs } from '../../stubs';

describe('contracts metadata', () => {
  const contractName = contractProjectMetadata.name;

  const accountsStubs = new AccountsStubs();
  const configStubs = new ConfigStubs();
  const filesystemStubs = new FilesystemStubs();
  const signingArchwayClientStubs = new SigningArchwayClientStubs();

  before(() => {
    accountsStubs.init();
    configStubs.init();
    configStubs.assertIsValidWorkspace();
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
    .command(['contracts metadata', contractName, `--rewards-address=${aliceAddress}`, `--from=${aliceAccountName}`])
    .it('Sets the metadata for a smart contract', ctx => {
      expect(ctx.stdout).to.contain('Metadata for the contract');
      expect(ctx.stdout).to.contain('updated');
      expect(ctx.stdout).to.contain(aliceAddress);
      expect(ctx.stdout).to.contain('Transaction:');
      expect(ctx.stdout).to.contain(dummyMetadataTransaction.transactionHash);
    });

  test
    .stdout()
    .command(['contracts metadata', contractName, `--rewards-address=${aliceAddress}`, `--from=${aliceAccountName}`, '--json'])
    .it('Prints json output', ctx => {
      expect(ctx.stdout).to.not.contain('uploaded');
      expect(ctx.stdout).to.contain(dummyMetadataTransaction.transactionHash);
      expect(ctx.stdout).to.contain(dummyMetadataTransaction.metadata.contractAddress);
      expect(ctx.stdout).to.contain(dummyMetadataTransaction.metadata.ownerAddress);
      expect(ctx.stdout).to.contain(dummyMetadataTransaction.gasUsed);
    });

  test
    .stdout()
    .stderr()
    .command(['contracts metadata', 'thisDoesntExist', `--rewards-address=${aliceAddress}`, `--from=${aliceAccountName}`])
    .catch(/(Contract).*(not found)/)
    .it('fails on invalid contract');

  test
    .stdout()
    .stderr()
    .command(['contracts metadata', contractName, `--from=${aliceAccountName}`])
    .catch(/(Metadata).*(not found)/)
    .it('fails on new values missing');
});
