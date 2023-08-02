import ow from 'ow';
import path from 'node:path';

import { bold } from '@/utils/style';
import { ChainRegistry } from './ChainRegistry';
import { DeploymentsByChain } from './DeploymentsByChain';
import { getWorkspaceRoot } from '@/utils/paths';
import { DEFAULT } from '@/config';
import { readFilesFromDirectory } from '@/utils/filesystem';
import { InvalidFormatError } from '@/exceptions';

import { DeploymentWithChain, DeploymentAction, DeploymentFile, deploymentFileValidator, Deployment } from '@/types/Deployment';
import { CargoProjectMetadata } from '@/types/Cargo';
import { Contract } from '@/types/Contract';

export const noDeploymentsMessage = 'No deployments found';

/**
 * Manages the deployments in the project
 */
export class Deployments {
  private _data: DeploymentsByChain[];
  private _deploymentsRoot: string;

  /**
   * @param data - Array of {@link DeploymentsByChain}
   * @param deploymentsRoot - Absolute path of the deployments directory
   */
  constructor(data: DeploymentsByChain[], deploymentsRoot: string) {
    this._data = data;
    this._deploymentsRoot = deploymentsRoot;
  }

  get data(): DeploymentsByChain[] {
    return this._data;
  }

  get deploymentsRoot(): string {
    return this._deploymentsRoot;
  }

  /**
   * Read the data form the deployment files of the project
   *
   * @param workingDir - Optional - Path of the working directory
   * @returns Promise containing and instance of {@link Deployments}
   */
  static async open(workingDir?: string): Promise<Deployments> {
    // Get all deployments of all chains
    const deploymentsRoot = await this.getDeploymentsRoot(workingDir);
    const filesRead = await readFilesFromDirectory(deploymentsRoot, DEFAULT.DeploymentFileExtension);

    const allDeployments: DeploymentsByChain[] = [];

    for (const [fileName, item] of Object.entries(filesRead)) {
      const deployment: DeploymentFile = JSON.parse(item);

      // Only add to deployments if file has valid format
      if (this.isValidDeploymentFile(deployment)) {
        allDeployments.push(DeploymentsByChain.init(deploymentsRoot, path.basename(fileName, DEFAULT.DeploymentFileExtension), deployment.deployments));
      }
    }

    return new Deployments(allDeployments, deploymentsRoot);
  }

  /**
   * Get the absolute path of the deployments directory
   *
   * @param workingDir - Optional - Path of the working directory
   * @returns Promise containing the absolute path of the deployments directory
   */
  static async getDeploymentsRoot(workingDir?: string): Promise<string> {
    const workspaceRoot = await getWorkspaceRoot(workingDir);

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
   * Return the list of all deployments
   *
   * @returns Array containing all the deployments
   */
  listDeployments(): DeploymentWithChain[] {
    let result: DeploymentWithChain[] = [];

    for (const item of this._data) {
      result = [...result, ...item.data.deployments.map(auxDeploy => ({ chainId: item.chainId, ...auxDeploy } as DeploymentWithChain))];
    }

    return result;
  }

  /**
   * Add deployment metadata into the registry, writing to the corresponding chain's deployment file
   *
   * @param deployment - Instance of {@link Deployment} to be stored in the deployments folder
   * @param chainId - Id of the chain where the deployment happened
   * @returns Empty promise
   */
  async addDeployment(deployment: Deployment, chainId: string): Promise<void> {
    const existingDeployments = this.getDeploymentsByChainId(chainId);

    if (existingDeployments) {
      existingDeployments.registerDeployment(deployment);
      await existingDeployments.write();
    } else {
      const newFile = DeploymentsByChain.init(this._deploymentsRoot, chainId, [deployment]);
      await newFile.write();
    }
  }

  /**
   * Filters the deployments by the arguments passed, returning them grouped by chain
   *
   * @param chainId - Chain id to search by
   * @returns Instance of {@link DeploymentsByChain} for the chain or undefined if not found
   */
  getDeploymentsByChainId(chainId: string): DeploymentsByChain | undefined {
    return this._data.find(item => item.chainId === chainId);
  }

  /**
   * Filters the deployments by the arguments passed, returning them grouped by chain
   *
   * @param chainId - Optional - Chain id to filter by
   * @param action  - Optional - Action to filter by
   * @param contractName - Optional - Contract name to filter by
   * @returns Array of instances of {@link DeploymentsByChain} with the results of the filtered deployments
   */
  filterGroupedByChain(chainId?: string, action?: DeploymentAction, contractName?: string): DeploymentsByChain[] {
    let result: DeploymentsByChain[] = [];

    for (const chainDeployments of this._data) {
      // Add deployments by chain, applying filters if they are set
      if (!chainId || chainDeployments.chainId === chainId) {
        const filtered = chainDeployments.data.deployments.filter(
          item => (!action || item.action === action) && (!contractName || item.contract.name === contractName)
        );

        if (filtered?.length) {
          result = [...result, DeploymentsByChain.init(this._deploymentsRoot, chainDeployments.chainId, filtered)];
        }
      }
    }

    return result;
  }

  /**
   * Filters the deployments by the arguments passed
   *
   * @param chainId - Optional - Chain id to filter by
   * @param action  - Optional - Action to filter by
   * @param contractName - Optional - Contract name to filter by
   * @returns Array of instances of {@link DeploymentWithChain} with the results of the filtered deployments
   */
  filterFlat(chainId?: string, action?: DeploymentAction, contractName?: string): DeploymentWithChain[] {
    const filtered = this.filterGroupedByChain(chainId, action, contractName);

    let result: DeploymentWithChain[] = [];

    for (const item of filtered) {
      result = [...result, ...item.data.deployments.map(auxDepl => ({ ...auxDepl, chainId: item.chainId }))];
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
    const filtered = this.filterGroupedByChain(chainId, action, contractName);

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
    const result = this.filterFlat(chainId, action, contractName);

    return { deployments: result } as DeploymentFile;
  }

  /**
   * Add deployment metadata to a {@link CargoProjectMetadata} object,
   * converting it into a {@link Contract} object
   *
   * @param metadata - Project Metadata to use as base for the {@link Contract} object
   * @returns An instance of {@link Contract}
   */
  makeContractFromMetadata(metadata: CargoProjectMetadata): Contract {
    const filteredDeployments = this.filterFlat(undefined, undefined, metadata.name);

    return {
      ...metadata,
      // TO DO Add deployments to Contract class
      deployments: filteredDeployments,
    };
  }
}
