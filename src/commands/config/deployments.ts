import { Flags } from '@oclif/core';

import { BaseCommand } from '@/lib/base';
import { Contracts, Deployments } from '@/domain';
import { chainOptional } from '@/flags';

import { DeploymentAction } from '@/types';

/**
 * Command 'config deployments'
 * Displays the list of deployments, allows filtering by chain, action and contract
 */
export default class ConfigDeployments extends BaseCommand<typeof ConfigDeployments> {
  static summary = 'Displays the list of deployments, allows filtering by chain, action and contract.';
  static flags = {
    chain: chainOptional,
    action: Flags.string({ options: Object.values(DeploymentAction), description: 'Deployment action to filter by' }),
    contract: Flags.string({ aliases: ['c'], description: 'Contract name to filter by' }),
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const deployments = await Deployments.open();

    // Should fail if contract flag is set and it doesn't exist in the registered Contracts
    if (this.flags.contract) {
      const contracts = await Contracts.open();
      contracts.assertGetContractByName(this.flags.contract);
    }

    this.log(await deployments.prettyPrint(this.flags.chain, this.flags.action as DeploymentAction, this.flags.contract));

    if (this.jsonEnabled()) {
      this.logJson(await deployments.toSingleDeploymentFile(this.flags.chain, this.flags.action as DeploymentAction, this.flags.contract));
    }
  }
}
