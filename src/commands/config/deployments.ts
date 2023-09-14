import { Flags } from '@oclif/core';

import { BaseCommand } from '@/lib/base';
import { Contracts, Deployments } from '@/domain';
import { ChainOptionalFlag } from '@/parameters/flags';

import { DeploymentAction } from '@/types';

/**
 * Command 'config deployments'
 * Displays the list of deployments, allows filtering by chain, action and contract
 */
export default class ConfigDeployments extends BaseCommand<typeof ConfigDeployments> {
  static summary = 'Displays the list of deployments, allows filtering by chain, action and contract';
  static flags = {
    chain: ChainOptionalFlag,
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
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const deployments = await Deployments.init();

    // Should fail if contract flag is set and it doesn't exist in the registered Contracts
    if (this.flags.contract) {
      const contracts = await Contracts.init();
      contracts.getContractByName(this.flags.contract);
    }

    await this.successMessage(deployments);
  }

  protected async successMessage(deployments: Deployments): Promise<void> {
    this.log(await deployments.prettyPrint(this.flags.chain, this.flags.action as DeploymentAction, this.flags.contract));

    if (this.jsonEnabled()) {
      this.logJson(deployments.toSingleDeploymentFile(this.flags.chain, this.flags.action as DeploymentAction, this.flags.contract));
    }
  }
}
