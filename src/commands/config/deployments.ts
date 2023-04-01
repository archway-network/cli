import { Flags } from '@oclif/core';
import { BaseCommand } from '../../lib/base';
import { DeploymentAction } from '../../types/Deployment';
import { Deployments } from '../../domain/Deployments';

export default class ConfigDeployments extends BaseCommand<typeof ConfigDeployments> {
  static summary = 'Lists deployments for the currently selected network or others, depending on the criteria';
  static flags = {
    chain: Flags.string(),
    action: Flags.string({ options: Object.values(DeploymentAction) }),
    contract: Flags.string({ aliases: ['c'] }),
  };

  public async run(): Promise<void> {
    const deployments = await Deployments.open();

    this.log(deployments.data.toString())
  }
}
