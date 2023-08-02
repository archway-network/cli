import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import toml from 'toml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import { bold, green, red } from '@/utils/style';
import { Contract } from '@/types/Contract';
import { getWorkspaceRoot } from '@/utils/paths';
import { DEFAULT, REPOSITORIES } from '@/config';
import { ErrorCodes } from '@/exceptions/ErrorCodes';
import { Cargo } from './Cargo';
import { readSubDirectories } from '@/utils/filesystem';
import { NotFoundError } from '@/exceptions';
import { Deployments } from './Deployments';
import { InstantiateError } from '@/commands/contracts/instantiate';

import { DeploymentAction, StoreDeployment } from '@/types/Deployment';
import { ConsoleError } from '@/types/ConsoleError';

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
    await cargo.wasm();
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

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async validateInstantiateSchema(contractName: string, initArgs: any): Promise<boolean> {
    const contract = this.assertGetContractByName(contractName)
    const schema = JSON.parse(await fs.readFile(path.join(contract.root, DEFAULT.InstantiateSchemaRelativePath), 'utf-8'));
    const validator = addFormats(new Ajv()).compile(schema);
    const isValid = validator(initArgs);

    if (!isValid) {
      throw new InstantiateError(
        `the message arguments does not match the schema: ${validator.errors
          ?.map(item => `${item.instancePath} ${item.message}`)
          .join(', ')}`
      );
    }

    return true;
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

  async findCodeId(contractName: string, chainId: string): Promise<number | undefined> {
    const contract = this.assertGetContractByName(contractName);

    const stored = contract.deployments.find(item => {
      const pastDeploy = item as StoreDeployment;

      return (
        pastDeploy.contract.version === contract.version && pastDeploy.action === DeploymentAction.STORE && pastDeploy.chainId === chainId
      );
    });

    return stored?.wasm.codeId;
  }
}

/**
 * Error when contract name is not found
 */
export class ContractNameNotFoundError extends ConsoleError {
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
export class InvalidWorkspaceError extends ConsoleError {
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
