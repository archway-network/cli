import { expect, test } from '@oclif/test';

import {
  aliceAccountName,
  contractArgument,
  contractArgumentSchema,
  contractProjectMetadata,
  dummyInstantiateTransaction,
} from '../../dummies';
import { AccountsStubs, ConfigStubs, FilesystemStubs, SigningArchwayClientStubs } from '../../stubs';

describe('contracts instantiate', () => {
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
    .command(['contracts instantiate', contractName, `--args=${contractArgument}`, `--from=${aliceAccountName}`])
    .it('Instantiates the smart contract', ctx => {
      expect(ctx.stdout).to.contain('instantiated');
      expect(ctx.stdout).to.contain(dummyInstantiateTransaction.contractAddress);
      expect(ctx.stdout).to.contain('Transaction:');
      expect(ctx.stdout).to.contain(dummyInstantiateTransaction.transactionHash);
    });

  test
    .stdout()
    .command(['contracts instantiate', contractName, `--args=${contractArgument}`, `--from=${aliceAccountName}`, '--json'])
    .it('Prints json output', ctx => {
      expect(ctx.stdout).to.not.contain('instantiated');
      expect(ctx.stdout).to.contain(dummyInstantiateTransaction.transactionHash);
      expect(ctx.stdout).to.contain(dummyInstantiateTransaction.contractAddress);
      expect(ctx.stdout).to.contain(dummyInstantiateTransaction.gasUsed);
    });

  describe('with code-id flag, without workspace files', () => {
    before(() => {
      configStubs.stubbedAssertIsValidWorkspace?.restore();
    });

    after(() => {
      configStubs.assertIsValidWorkspace();
    });

    test
      .stdout()
      .command(['contracts instantiate', '--code=1', '--label=test', `--args=${contractArgument}`, `--from=${aliceAccountName}`, '--json'])
      .it('Prints json output', ctx => {
        expect(ctx.stdout).to.not.contain('instantiated');
        expect(ctx.stdout).to.contain(dummyInstantiateTransaction.transactionHash);
        expect(ctx.stdout).to.contain(dummyInstantiateTransaction.contractAddress);
        expect(ctx.stdout).to.contain(dummyInstantiateTransaction.gasUsed);
      });
  });

  test
    .stdout()
    .stderr()
    .command(['contracts instantiate', 'thisDoesntExist', `--args=${contractArgument}`, `--from=${aliceAccountName}`])
    .catch(/(Contract).*(not found)/)
    .it('fails on invalid contract');

  test
    .stdout()
    .stderr()
    .command(['contracts instantiate', contractName, '--args={}', `--from=${aliceAccountName}`])
    .catch(/(Failed to instantiate).*(do not match the schema)/)
    .it('fails on invalid arguments');

  test
    .stdout()
    .command(['contracts instantiate', contractName, '--args={}', `--from=${aliceAccountName}`, '--no-validation'])
    .it("Skips validation of args and doesn't fail", ctx => {
      expect(ctx.stdout).to.contain(dummyInstantiateTransaction.transactionHash);
    });
});
