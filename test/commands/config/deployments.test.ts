import { expect, test } from '@oclif/test';

import { expectOutputJSON } from '../../helpers/expect';
import { NO_DEPLOYMENTS_MESSAGE } from '../../../src/domain';
import { deploymentFile } from '../../dummies';
import DeploymentsStubs from '../../stubs/deployments';

describe('config deployments', () => {
  const deploymentsStubs = new DeploymentsStubs();

  describe('successful', () => {
    before(() => {
      deploymentsStubs.init();
    });

    after(() => {
      deploymentsStubs.restoreAll();
    });

    test
      .stdout()
      .command(['config deployments'])
      .it('shows deployments', ctx => {
        expect(ctx.stdout).to.contain('Deployments on');
        expect(ctx.stdout).to.contain(deploymentFile.deployments[0].contract.name);
        expect(ctx.stdout).to.contain(deploymentFile.deployments[0].contract.version);
      });

    test
      .stdout()
      .command(['config deployments', '--action=premium'])
      .it('filters out deployments by action', ctx => {
        expect(ctx.stdout).to.contain(NO_DEPLOYMENTS_MESSAGE);
      });

    test
      .stdout()
      .env({ ARCHWAY_SKIP_VERSION_CHECK: 'true' })
      .command(['config deployments', '--json'])
      .it('shows a JSON representation of the deployments', expectOutputJSON);
  });

  describe('no deployments', () => {
    before(() => {
      deploymentsStubs.initZeroDeployments();
    });

    after(() => {
      deploymentsStubs.restoreAll();
    });
    test
      .stdout()
      .command(['config deployments'])
      .it('shows no deployments', ctx => {
        expect(ctx.stdout).to.contain(NO_DEPLOYMENTS_MESSAGE);
      });

    test
      .stdout()
      .stderr()
      .command(['config deployments', '--chain=fake'])
      .catch(/(Chain).*(not found)/)
      .it('fails on chain flag not found');

    test
      .stdout()
      .stderr()
      .command(['config deployments', '--contract=fake'])
      .catch(/(Contract).*(not found)/)
      .it('fails on contract flag not found');
  });
});
