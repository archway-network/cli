import { expect, test } from '@oclif/test';

import { contractProjectMetadata, dummyAmount, instantiateDeployment } from '../../../dummies';

import { expectOutputJSON } from '../../../helpers/expect';
import { ConfigStubs, StargateClientStubs } from '../../../stubs';

describe('contracts query balance', () => {
  const contractName = contractProjectMetadata.name;

  const configStubs = new ConfigStubs();
  const stargateClientStubs = new StargateClientStubs();

  before(() => {
    configStubs.init();
    configStubs.assertIsValidWorkspace();
    stargateClientStubs.connect();
  });

  after(() => {
    configStubs.restoreAll();
    stargateClientStubs.restoreAll();
  });

  test
    .stdout()
    .command(['contracts query balance', contractName])
    .it('Query balance of a contract', ctx => {
      expect(ctx.stdout).to.contain('Balances for contract');
      expect(ctx.stdout).to.contain(instantiateDeployment.contract.name);
      expect(ctx.stdout).to.contain(dummyAmount.amount);
      expect(ctx.stdout).to.contain(dummyAmount.denom);
    });

  test.stdout().command(['contracts query balance', contractName, '--json']).it('Prints json output', expectOutputJSON);

  test
    .stdout()
    .stderr()
    .command(['contracts query balance', 'thisDoesntExist'])
    .catch(/(Contract).*(not found)/)
    .it('fails on invalid contract');
});
