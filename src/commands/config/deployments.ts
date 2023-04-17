import { Flags } from '@oclif/core';
import { BaseCommand } from '../../lib/base';
import { DeploymentAction } from '../../types/Deployment';
import { Deployments } from '../../domain/Deployments';
import { Contracts } from '../../domain/Contracts';
import { chainOptional } from '../../flags/chain';

export default class ConfigDeployments extends BaseCommand<typeof ConfigDeployments> {
  static summary = 'Lists deployments for the currently selected network or others, depending on the criteria';
  static flags = {
    chain: chainOptional(),
    action: Flags.string({ options: Object.values(DeploymentAction) }),
    contract: Flags.string({ aliases: ['c'] }),
  };

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
