import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import toml from 'toml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import { readSubDirectories, getWorkspaceRoot, bold, green, red } from '@/utils';
import { Contract } from '@/types';
import { DEFAULT, REPOSITORIES } from '@/GlobalConfig';
import { Cargo, Deployments } from '@/domain';
import { ErrorCodes, ExecuteError, InstantiateError, NotFoundError } from '@/exceptions';

import { ConsoleError, DeploymentAction, InstantiateDeployment, StoreDeployment } from '@/types';

/**
 * Manages the contracts' data in the project
 */
export class Contracts {
  private _data: Contract[];
  private _workspaceRoot: string;
  private _contractsRoot: string;
  private _deployments: Deployments;

  /**
   * @param data - Array of {@link Contract}
   * @param workspaceRoot - Absolute path of the project's workspace root
   * @param contractsRoot - Path of the directory where contracts will be found
   * @param deployments - Instance of {@link Deployments} of the project
   */
  constructor(data: Contract[], workspaceRoot: string, contractsRoot: string, deployments: Deployments) {
    this._data = data;
    this._workspaceRoot = workspaceRoot;
    this._contractsRoot = contractsRoot;
    this._deployments = deployments;
  }

  get data(): Contract[] {
    return this._data;
  }

  get workspaceRoot(): string {
    return this._workspaceRoot;
  }

  get contractsRoot(): string {
    return this._contractsRoot;
  }

  get deployments(): Deployments {
    return this._deployments;
  }

  /**
   * Open the contract files in the project
   *
   * @param workingDir - Optional - Path of the working directory
   * @param contractsPath - Optional - Path where the contracts are in the project
   * @returns Promise containing an instance of {@link Contracts}
   */
  static async open(workingDir?: string, contractsPath?: string): Promise<Contracts> {
    const workspaceRoot = await getWorkspaceRoot(workingDir);
    const contractsRoot = await this.getContractsRoot(workingDir, contractsPath);

    const contractDirectories = await readSubDirectories(contractsRoot);

    const cargoInstances = contractDirectories.map(item => new Cargo(item));

    const data = await Promise.all(cargoInstances.map(item => item.projectMetadata()));

    const deployments = await Deployments.open(workingDir);

    return new Contracts(
      data.map(item => deployments.makeContractFromMetadata(item)),
      workspaceRoot,
      contractsRoot,
      deployments
    );
  }

  /**
   * Get the absolute path of the contracts directory
   *
   * @param workingDir - Optional - Path of the working directory
   * @param contractsPath - Optional - Path of the contracts directory
   * @returns Promise containing the absolute path of the contracts directory
   */
  static async getContractsRoot(workingDir?: string, contractsPath?: string): Promise<string> {
    const workspaceRoot = await getWorkspaceRoot(workingDir);
    const contracts = contractsPath || DEFAULT.ContractsRelativePath;

    return path.isAbsolute(contracts) ? contracts : path.join(workspaceRoot, contracts);
  }

  /**
   * Verifies that a project has a valid workspace
   *
   * @returns Empty promise
   */
  async assertValidWorkspace(): Promise<void> {
    const relativeContracts = `${path.relative(this._workspaceRoot, this._contractsRoot)}/*`;
    const cargoFilePath = path.join(this._workspaceRoot, './Cargo.toml');

    const fileContent = await fs.readFile(cargoFilePath, 'utf-8');
    const data = toml.parse(fileContent);

    if (!data?.workspace?.members?.some((item: string) => item === relativeContracts))
      throw new InvalidWorkspaceError(cargoFilePath, relativeContracts);
  }

  /**
   * Create a new contract from one of the archway templates
   *
   * @param name - Contract name
   * @param template - Name of the template to use
   * @returns Promise containing an instance of {@link Contract} that was created
   */
  async new(name: string, template: string): Promise<Contract> {
    const cargo = new Cargo();
    await cargo.generate({
      name,
      repository: REPOSITORIES.Templates,
      branch: DEFAULT.TemplateBranch,
      template: template,
      destinationDir: this.contractsRoot,
    });
    const generatedPath = path.join(this.contractsRoot, name);
    const generatedCrate = new Cargo(generatedPath);
    const metadata = await generatedCrate.projectMetadata();
    const result = this._deployments.makeContractFromMetadata(metadata);
    this._data.push(result);

    return result;
  }

  /**
   * Build a contract
   *
   * @param name - Contract name
   * @returns Path of the output file
   */
  async build(name: string): Promise<string> {
    const cargo = this.cargoByContractName(name);
    const { wasm } = await cargo.projectMetadata();

    await cargo.build();

    return wasm.filePath;
  }

  /**
   * Generate a contract's schema files
   *
   * @param name - Contract name
   * @returns Empty Promise
   */
  async schemas(name: string): Promise<void> {
    const cargo = this.cargoByContractName(name);
    await cargo.schema();
  }

  /**
   * Build the optimized version of a contract
   *
   * @param name - Contract name
   * @returns Path of the optimized file
   */
  async optimize(name: string): Promise<string> {
    const cargo = this.cargoByContractName(name);
    const { wasm } = await cargo.projectMetadata();

    await cargo.optimize();
    return wasm.optimizedFilePath;
  }

  /**
   * Creates a {@link Cargo} instance of a contract, by contract name
   *
   * @param name - Contract name
   * @returns Empty Promise
   */
  private cargoByContractName(name: string): Cargo {
    const contract = this._data.find(item => item.name === name);

    if (!contract) throw new NotFoundError('Contract', name);

    return new Cargo(contract.root);
  }

  /**
   * Return the list of all contracts
   *
   * @returns Array containing all the contracts
   */
  listContracts(): Contract[] {
    return this._data;
  }

  /**
   * Check if a contract exists by name, if not found throws an error
   *
   * @param contractName - Name of the contract to get
   * @returns The contract matching the name
   */
  assertGetContractByName(contractName: string): Contract {
    const result = this.getContractByName(contractName);

    if (!result) throw new ContractNameNotFoundError(contractName);

    return result;
  }

  /**
   * Get a contract by its name
   *
   * @param contractName - Name of the contract to get
   * @returns Instance of {@link Contract} that matches the name, or undefined if not found
   */
  getContractByName(contractName: string): Contract | undefined {
    return this._data.find(item => item.name === contractName);
  }

  /**
   * Get a formatted version of the contracts in the project
   *
   * @returns Promise containing the formatted contracts data
   */
  async prettyPrint(): Promise<string> {
    let contractsList = '';
    for (const item of this._data) {
      contractsList += `\n  ${green(item.name)} (${item.version})`;
    }

    if (!contractsList) contractsList = '(none)';

    return `${bold('Available contracts: ')}${contractsList}`;
  }

  private async assertValidJSONSchema(schemaPath: string, data: any): Promise<void> {
    const schema = JSON.parse(await fs.readFile(path.resolve(schemaPath), 'utf-8'));
    const validator = addFormats(new Ajv()).compile(schema);
    const isValid = validator(data);

    if (!isValid) {
      throw new Error(`${validator.errors?.map(item => `${item.instancePath} ${item.message}`).join(', ')}`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async assertValidInstantiateArgs(contractName: string, initArgs: any): Promise<void> {
    const contract = this.assertGetContractByName(contractName);
    const schemaPath = path.join(contract.root, DEFAULT.InstantiateSchemaRelativePath);

    try {
      this.assertValidJSONSchema(schemaPath, initArgs);
    } catch (error: Error | any) {
      throw new InstantiateError(`the message arguments does not match the schema: ${error.message}`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async assertValidExecuteArgs(contractName: string, executeArgs: any): Promise<void> {
    const contract = this.assertGetContractByName(contractName);
    const schemaPath = path.join(contract.root, DEFAULT.ExecuteSchemaRelativePath);

    try {
      this.assertValidJSONSchema(schemaPath, executeArgs);
    } catch (error: Error | any) {
      throw new ExecuteError(`the message arguments does not match the schema: ${error.message}`);
    }
  }

  /**
   * Generate the checksum of the current optimized build of a contract
   *
   * @param contractName - Name of the contract to generate checksum of
   * @returns Promise containing the checksum
   */
  async generateChecksum(contractName: string): Promise<string> {
    const contract = this.assertGetContractByName(contractName);

    const fileBuffer = await fs.readFile(contract.wasm.optimizedFilePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);

    return hashSum.digest('hex');
  }

  /**
   * Verifies if the checksum of the current optimized build has already been deployed
   *
   * @param contractName - Name of the contract to verify
   * @param chainId - Id of the chain
   * @returns Promise containing true or false
   */
  async isChecksumAlreadyDeployed(contractName: string, chainId: string): Promise<StoreDeployment | undefined> {
    const checksum = await this.generateChecksum(contractName);

    const deployments = this._deployments.filterFlat(chainId, undefined, contractName);

    return deployments.find(
      item => item.action === DeploymentAction.STORE && checksum === (item as StoreDeployment).wasm.checksum
    ) as StoreDeployment;
  }

  /**
   * Find a past Store deployment of a contract
   *
   * @param contractName - Name of the contract to search by
   * @param chainId - Chain id to search by
   * @returns Promise containing an instance of {@link StoreDeployment} or undefined if not found
   */
  async findStoreDeployment(contractName: string, chainId: string): Promise<StoreDeployment | undefined> {
    const contract = this.assertGetContractByName(contractName);

    return contract.deployments.find(item => {
      const pastDeploy = item as StoreDeployment;

      return (
        pastDeploy.contract.version === contract.version && pastDeploy.action === DeploymentAction.STORE && pastDeploy.chainId === chainId
      );
    }) as StoreDeployment | undefined;
  }

  /**
   * Find a past Instantiate deployment of a contract
   *
   * @param contractName - Name of the contract to search by
   * @param chainId - Chain id to search by
   * @returns Promise containing an instance of {@link InstantiateDeployment} or undefined if not found
   */
  async findInstantiateDeployment(contractName: string, chainId: string): Promise<InstantiateDeployment | undefined> {
    const contract = this.assertGetContractByName(contractName);

    return contract.deployments.find(item => {
      const pastDeploy = item as InstantiateDeployment;

      return (
        pastDeploy.contract.version === contract.version &&
        pastDeploy.action === DeploymentAction.INSTANTIATE &&
        pastDeploy.chainId === chainId
      );
    }) as InstantiateDeployment | undefined;
  }
}

/**
 * Error when contract name is not found
 */
class ContractNameNotFoundError extends ConsoleError {
  /**
   * @param contractName - Contract name that triggered the error
   */
  constructor(public contractName: string) {
    super(ErrorCodes.CONTRACT_NAME_NOT_FOUND);
  }

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    return `${red('Contract with name')} ${bold(this.contractName)} ${red('not found')}`;
  }
}

/**
 * Error when project workspace is invalid
 */
class InvalidWorkspaceError extends ConsoleError {
  /**
   * @param cargoFilePath - Path of the cargo file
   * @param requiredWorkspaceMember - Required value in workspace.members array
   */
  constructor(public cargoFilePath: string, public requiredWorkspaceMember: string) {
    super(ErrorCodes.INVALID_WORKSPACE_ERROR);
  }

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    return `${red('Invalid cargo file')} ${bold(this.cargoFilePath)} ${red(' please make sure it is a workspace and has')} ${bold(
      `"${this.requiredWorkspaceMember}"`
    )} ${red('in the members array')}`;
  }
}
