import { DeploymentFile } from '../types/Deployment';
import { ChainRegistry } from './ChainRegistry';
import { DeploymentsByChain } from './DeploymentsByChain';

export class AllDeployments {
  private _data: DeploymentsByChain[];

  constructor(data: DeploymentsByChain[]) {
    this._data = data;
  }

  get data(): DeploymentsByChain[] {
    return this._data;
  }

  static async open(): Promise<AllDeployments> {
    // Get list of chains creating a chain registry instance
    const chainRegistry = await ChainRegistry.init();

    // Get all deployments of all chains
    const allDeployments = await Promise.all(chainRegistry.data.map(item => DeploymentsByChain.open(item.chain_id)));

    return new AllDeployments(allDeployments);
  }
}
