import { Flags } from '@oclif/core';
import { BaseCommand } from '../../lib/base';
import { DeploymentAction } from '../../types/Deployment';
import { Deployments } from '../../domain/Deployments';
import { ChainRegistry } from '../../domain/ChainRegistry';
import { ChainIdNotFoundError, ContractNameNotFoundError } from '../../exceptions';
import { Contracts } from '../../domain/Contracts';

export default class ConfigDeployments extends BaseCommand<typeof ConfigDeployments> {
  static summary = 'Lists deployments for the currently selected network or others, depending on the criteria';
  static flags = {
    chain: Flags.string(),
    action: Flags.string({ options: Object.values(DeploymentAction) }),
    contract: Flags.string({ aliases: ['c'] }),
  };

  public async run(): Promise<void> {
    const deployments = await Deployments.open();

    // Should fail if chain flag is set and it doesn't exist in the registry
    if (this.flags.chain) {
      const chainRegistry = await ChainRegistry.init();
      if (!chainRegistry.getChainById(this.flags.chain)) this.error(new ChainIdNotFoundError(this.flags.chain).toConsoleString());
    }

    // Should fail if contract flag is set and it doesn't exist in the registered Contracts
    if (this.flags.contract) {
      const contracts = await Contracts.open();
      if (!contracts.getContractByName(this.flags.contract)) this.error(new ContractNameNotFoundError(this.flags.contract).toConsoleString());
    }

    this.log(await deployments.prettyPrint(this.flags.chain, this.flags.action as DeploymentAction, this.flags.contract));

    if (this.jsonEnabled()) {
      this.logJson(await deployments.toSingleDeploymentFile(this.flags.chain, this.flags.action as DeploymentAction, this.flags.contract));
    }
  }
}
