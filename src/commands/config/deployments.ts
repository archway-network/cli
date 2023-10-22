import { Flags } from '@oclif/core';

import { Contracts, Deployments } from '@/domain';
import { BaseCommand } from '@/lib/base';
import { CustomFlags } from '@/parameters/flags';
import { DeploymentAction, DeploymentFile } from '@/types';

/**
 * Command 'config deployments'
 * Displays the list of deployments, allows filtering by chain, action and contract
 */
export default class ConfigDeployments extends BaseCommand<typeof ConfigDeployments> {
  static summary = 'Displays the list of deployments, allows filtering by chain, action and contract';
  static flags = {
    chain: CustomFlags.chainId(),
    action: Flags.string({ options: Object.values(DeploymentAction), description: 'Deployment action to filter by' }),
    contract: Flags.string({ aliases: ['c'], description: 'Contract name to filter by' }),
  };

  static examples = [
    {
      description: 'Query all the deployments in the project',
      command: '<%= config.bin %> <%= command.id %>',
    },
    {
      description: 'Filter deployments by chain id',
      command: '<%= config.bin %> <%= command.id %> --chain "constantine-3"',
    },
    {
      description: 'Filter deployments by action',
      command: '<%= config.bin %> <%= command.id %> --action "store"',
    },
    {
      description: 'Filter deployments by contract name',
      command: '<%= config.bin %> <%= command.id %> --contract "my-contract"',
    },
  ];

  /**
   * Runs the command.
   *
   * @returns Promise with a {@link DeploymentFile}
   */
  public async run(): Promise<DeploymentFile> {
    const deployments = await Deployments.init();

    // Should fail if contract flag is set and it doesn't exist in the registered Contracts
    if (this.flags.contract) {
      const contracts = await Contracts.init();
      contracts.getContractByName(this.flags.contract);
    }

    this.log(await deployments.prettyPrint(this.flags.chain, this.flags.action as DeploymentAction, this.flags.contract));

    return deployments.toSingleDeploymentFile(this.flags.chain, this.flags.action as DeploymentAction, this.flags.contract);
  }
}
