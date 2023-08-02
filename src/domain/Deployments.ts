import ow from 'ow';
import path from 'node:path';

import { bold } from '@/utils/style';
import { Deployment, DeploymentAction, DeploymentFile, deploymentFileValidator } from '@/types/Deployment';
import { ChainRegistry } from './ChainRegistry';
import { DeploymentsByChain } from './DeploymentsByChain';
import { getWokspaceRoot } from '@/utils/paths';
import { DEFAULT } from '@/config';
import { readFilesFromDirectory } from '@/utils/filesystem';
import { InvalidFormatError } from '@/exceptions';

export const noDeploymentsMessage = 'No deployments found';

/**
 * Manages the deployments in the project
 */
export class Deployments {
  private _data: DeploymentsByChain[];

  /**
   * @param data - Array of {@link DeploymentsByChain}
   */
  constructor(data: DeploymentsByChain[]) {
    this._data = data;
  }

  get data(): DeploymentsByChain[] {
    return this._data;
  }

  /**
   * Read the data form the deployment files of the project
   *
   * @returns Promise containing and instance of {@link Deployments}
   */
  static async open(): Promise<Deployments> {
    // Get all deployments of all chains
    const deploymentsPath = await this.getDeploymentsPath();
    const filesRead = await readFilesFromDirectory(deploymentsPath, DEFAULT.DeploymentFileExtension);

    const allDeployments: DeploymentsByChain[] = [];

    for (const [fileName, item] of Object.entries(filesRead)) {
      const deployment: DeploymentFile = JSON.parse(item);

      // Only add to deployments if file has valid format
      if (this.isValidDeploymentFile(deployment)) {
        allDeployments.push(new DeploymentsByChain(path.basename(fileName, DEFAULT.DeploymentFileExtension), deployment));
      }
    }

    return new Deployments(allDeployments);
  }

  /**
   * Get the absolute path of the deployments directory
   *
   * @returns Promise containing the absolute path of the deployments directory
   */
  static async getDeploymentsPath(): Promise<string> {
    const workspaceRoot = await getWokspaceRoot();

    return path.join(workspaceRoot, DEFAULT.DeploymentsRelativePath);
  }

  /**
   * Verify if an object has the valid format of a {@link DeploymentFile}, throws error if not
   *
   * @param data - Object instance to validate
   * @param name - Optional - Name of the file, will be used in the possible error
   * @returns void
   */
  static assertIsValidDeploymentFile = (data: unknown, name?: string): void => {
    if (!this.isValidDeploymentFile(data)) throw new InvalidFormatError(name || 'Deployment file');
  };

  /**
   * Verify if an object has the valid format of a {@link DeploymentFile}
   *
   * @param data - Object instance to validate
   * @returns Boolean, whether it is valid or not
   */
  static isValidDeploymentFile = (data: unknown): boolean => {
    return ow.isValid(data, deploymentFileValidator);
  };

  /**
   * Filters the deployments by the arguments passed
   *
   * @param chainId - Optional - Chain id to filter by
   * @param action  - Optional - Action to filter by
   * @param contractName - Optional - Contract name to filter by
   * @returns Array with the results of the filtered deployments
   */
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

  /**
   * Get a formatted version of the deployments, allows filtering by arguments passed to the function
   *
   * @param chainId - Optional - Chain id to filter by
   * @param action  - Optional - Action to filter by
   * @param contractName - Optional - Contract name to filter by
   * @returns Promise containing the formatted string of the deployements that match the filters
   */
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

  /**
   * Get deployments in a single object, allows filtering by arguments passed to the function
   *
   * @param chainId - Optional - Chain id to filter by
   * @param action  - Optional - Action to filter by
   * @param contractName - Optional - Contract name to filter by
   * @returns Instance of {@link DeploymentFile} containing the deployments that match the filters
   */
  toSingleDeploymentFile(chainId?: string, action?: DeploymentAction, contractName?: string): DeploymentFile {
    const filtered = this.filter(chainId, action, contractName);

    let allDeployments: Deployment[] = [];

    for (const item of filtered) {
      allDeployments = [...allDeployments, ...item.data.deployments];
    }

    return { deployments: allDeployments } as DeploymentFile;
  }
}
