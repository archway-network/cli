import { bold } from '../utils/style';
import { Deployment, DeploymentAction, DeploymentFile } from '../types/Deployment';
import { ChainRegistry } from './ChainRegistry';
import { DeploymentsByChain } from './DeploymentsByChain';
import { getWokspaceRoot } from '../utils/paths';
import { DEFAULT } from '../config';
import path from 'node:path';
import { readFilesFromDirectory } from '../utils/filesystem';

export const noDeploymentsMessage = 'No deployments found';

export class Deployments {
  private _data: DeploymentsByChain[];

  constructor(data: DeploymentsByChain[]) {
    this._data = data;
  }

  get data(): DeploymentsByChain[] {
    return this._data;
  }

  static async open(): Promise<Deployments> {
    // Get all deployments of all chains
    const deploymentsPath = await this.getDeploymentsPath();
    const filesRead = await readFilesFromDirectory(deploymentsPath, DEFAULT.DeploymentFileExtension);

    const allDeployments: DeploymentsByChain[] = [];

    for (const [fileName, item] of Object.entries(filesRead)) {
      const deployment: DeploymentFile = JSON.parse(item);
      allDeployments.push(new DeploymentsByChain(path.basename(fileName, DEFAULT.DeploymentFileExtension), deployment));
    }

    return new Deployments(allDeployments);
  }

  static async getDeploymentsPath(): Promise<string> {
    const workspaceRoot = await getWokspaceRoot();

    return path.join(workspaceRoot, DEFAULT.DeploymentsRelativePath);
  }

  filter(chainId?: string, action?: DeploymentAction, contractName?: string): DeploymentsByChain[] {
    let result: DeploymentsByChain[] = [];

    for (const chainDeployments of this._data) {
      // Add deployments by chain, applying filters if they are set
      if (!chainId || chainDeployments.chainId === chainId) {
        const filtered = chainDeployments.data.deployments.filter(
          item => (!action || item.action === action) && (!contractName || item.contract.name === contractName)
        );

        if (filtered?.length) {
          result = [...result, DeploymentsByChain.init(chainDeployments.chainId, filtered)];
        }
      }
    }

    return result;
  }

  async prettyPrint(chainId?: string, action?: DeploymentAction, contractName?: string): Promise<string> {
    const filtered = this.filter(chainId, action, contractName);

    if (!filtered?.length) {
      return `${bold(noDeploymentsMessage)}`;
    }

    // Create chain registry instance to get explorer url
    const chainRegistry = await ChainRegistry.init();

    // Create result string and loop through deployments by chain
    let result = '';
    let isFirst = true;

    for (const item of filtered) {
      const explorerTxUrl = chainRegistry.getChainById(item.chainId)?.explorers?.find(item => Boolean(item.tx_page))?.tx_page;
      result += `${isFirst ? '' : '\n\n\n'}${item.prettyPrint(explorerTxUrl)}`;
      isFirst = false;
    }

    return result;
  }

  toSingleDeploymentFile(chainId?: string, action?: DeploymentAction, contractName?: string): DeploymentFile {
    const filtered = this.filter(chainId, action, contractName);

    let allDeployments: Deployment[] = [];

    for (const item of filtered) {
      allDeployments = [...allDeployments, ...item.data.deployments];
    }

    return { deployments: allDeployments } as DeploymentFile;
  }
}
