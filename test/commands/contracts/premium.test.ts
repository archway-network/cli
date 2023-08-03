import { expect, test } from '@oclif/test';

import { aliceAccountName, contractProjectMetadata, dummyPremiumTransaction } from '../../dummies';
import { AccountsStubs, ConfigStubs, SigningArchwayClientStubs } from '../../stubs';

describe('contracts premium', () => {
  const contractName = contractProjectMetadata.name;
  const newFee = '3aconst';

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
    .command(['contracts premium', contractName, `--premium-fee=${newFee}`, `--from=${aliceAccountName}`])
    .it('Sets the premium fee for a smart contract', ctx => {
      expect(ctx.stdout).to.contain('Premium for the contract');
      expect(ctx.stdout).to.contain('updated');
      expect(ctx.stdout).to.contain(newFee);
      expect(ctx.stdout).to.contain('Transaction:');
      expect(ctx.stdout).to.contain(dummyPremiumTransaction.transactionHash);
    });

  test
    .stdout()
    .command(['contracts premium', contractName, `--premium-fee=${newFee}`, `--from=${aliceAccountName}`, '--json'])
    .it('Prints json output', ctx => {
      expect(ctx.stdout).to.not.contain('uploaded');
      expect(ctx.stdout).to.contain(dummyPremiumTransaction.transactionHash);
      expect(ctx.stdout).to.contain(dummyPremiumTransaction.premium.contractAddress);
      expect(ctx.stdout).to.contain(dummyPremiumTransaction.premium.flatFee.denom);
      expect(ctx.stdout).to.contain(dummyPremiumTransaction.premium.flatFee.amount);
      expect(ctx.stdout).to.contain(dummyPremiumTransaction.gasUsed);
    });

  test
    .stdout()
    .stderr()
    .command(['contracts premium', 'thisDoesntExist', `--premium-fee=${newFee}`, `--from=${aliceAccountName}`])
    .catch(/(Contract).*(not found)/)
    .it('fails on invalid contract');
});
