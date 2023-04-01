import { DeploymentFile } from '../types/Deployment';
import { ChainRegistry } from './ChainRegistry';
import { DeploymentsByChain } from './DeploymentsByChain';

export class Deployments {
  private _data: DeploymentFile[];

  constructor(data: DeploymentFile[]) {
    this._data = data;
  }

  get data(): DeploymentFile[] {
    return this._data;
  }

  static async open(): Promise<Deployments> {
    // Get list of chains creating a chain registry instance
    const chainRegistry = await ChainRegistry.init();
    // Get all deployments of all chains
    const allDeployments = await Promise.all(chainRegistry.data.map(item => DeploymentsByChain.open(item.chain_id)));
    // Create a Deployments object
    return new Deployments(allDeployments.map(item => item.data));
  }
}
