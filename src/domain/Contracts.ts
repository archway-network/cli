import { Coin, StargateClient } from '@cosmjs/stargate';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import toml from 'toml';

import { Cargo, Deployments } from '@/domain';
import { ErrorCodes, ExecuteError, InstantiateError, NotFoundError, QueryError } from '@/exceptions';
import { AccountBalancesJSON, Contract } from '@/types';
import { bold, getWorkspaceRoot, green, greenBright, prettyPrintBalancesList, readSubDirectories, redBright } from '@/utils';

import { ConsoleError, DeploymentAction, InstantiateDeployment, StoreDeployment } from '@/types';
import { SchemaValidator } from './SchemaValidation';

/** Contracts file constants */
export const DEFAULT_CONTRACTS_RELATIVE_PATH = './contracts';

/** Contract Templates constants */
export const TEMPLATES_REPOSITORY = 'https://github.com/archway-network/archway-templates';
export const DEFAULT_TEMPLATE_BRANCH = 'chore/update-templates';
export const DEFAULT_WORKSPACE_TEMPLATE = 'base-workspace';

/** Message schema validation constants */
export const INSTANTIATE_SCHEMA_RELATIVE_PATH = './schema/raw/instantiate.json';
export const EXECUTE_SCHEMA_RELATIVE_PATH = './schema/raw/execute.json';
export const QUERY_SCHEMA_RELATIVE_PATH = './schema/raw/query.json';

/**
 * Manages the contracts' data in the project
 */
export class Contracts {
  private _data: Contract[];
  private _workspaceRoot: string;
  private _contractsRoot: string;
  private _deployments: Deployments;
  private _schemaValidator: SchemaValidator;

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
    this._schemaValidator = new SchemaValidator();
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

  get schemaValidator(): SchemaValidator {
    return this._schemaValidator;
  }

  /**
   * Open the contract files in the project
   *
   * @param workingDir - Optional - Path of the working directory
   * @param contractsPath - Optional - Path where the contracts are in the project
   * @returns Promise containing an instance of {@link Contracts}
   */
  static async init(workingDir?: string, contractsPath?: string): Promise<Contracts> {
    const workspaceRoot = await getWorkspaceRoot(workingDir);
    const contractsRoot = await this.getContractsRoot(workingDir, contractsPath);

    const contractDirectories = await readSubDirectories(contractsRoot);

    const cargoInstances = contractDirectories.map(item => new Cargo(item));

    const data = await Promise.all(cargoInstances.map(item => item.projectMetadata()));

    const deployments = await Deployments.init(workingDir);

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
    const contracts = contractsPath || DEFAULT_CONTRACTS_RELATIVE_PATH;

    return path.isAbsolute(contracts) ? contracts : path.join(workspaceRoot, contracts);
  }

  /**
   * Verifies that a project has a valid workspace, throws an error if not
   *
   * @returns Empty promise
   */
  async assertIsValidWorkspace(): Promise<void> {
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
   * @param quiet - Optional - Execute the cargo commands on quiet mode. Defaults to false
   * @returns Promise containing an instance of {@link Contract} that was created
   */
  async create(name: string, template: string, quiet = false): Promise<Contract> {
    const cargo = new Cargo();
    await cargo.generate({
      name,
      repository: TEMPLATES_REPOSITORY,
      branch: DEFAULT_TEMPLATE_BRANCH,
      template: template,
      destinationDir: this.contractsRoot,
      quiet,
    });
    const generatedPath = path.join(this.contractsRoot, name);
    const generatedCrate = new Cargo(generatedPath);
    const metadata = await generatedCrate.projectMetadata();

    await generatedCrate.build({ quiet });
    await generatedCrate.schema({ quiet });

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
  getContractByName(contractName: string): Contract {
    const result = this._data.find(item => item.name === contractName);

    if (!result) throw new ContractNameNotFoundError(contractName);

    return result;
  }

  /**
   * Get a formatted version of the contracts in the project
   *
   * @returns Promise containing the formatted contracts data
   */
  async prettyPrint(): Promise<string> {
    let contractsList = '';
    for (const item of this._data) {
      contractsList += `\n  ${greenBright(item.name)} (${item.version})`;
    }

    if (!contractsList) contractsList = '(none)';

    return `${bold('Available contracts: ')}${contractsList}`;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async assertValidInstantiateArgs(contractName: string, initArgs: any): Promise<void> {
    const contract = this.getContractByName(contractName);
    const schemaPath = path.join(contract.root, INSTANTIATE_SCHEMA_RELATIVE_PATH);

    try {
      await this.schemaValidator.assertValidJSONSchema(schemaPath, initArgs);
    } catch (error: Error | any) {
      throw new InstantiateError(`the instantiate arguments does not match the schema: ${error.message}`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async assertValidExecuteArgs(contractName: string, executeArgs: any): Promise<void> {
    const contract = this.getContractByName(contractName);
    const schemaPath = path.join(contract.root, EXECUTE_SCHEMA_RELATIVE_PATH);

    try {
      await this.schemaValidator.assertValidJSONSchema(schemaPath, executeArgs);
    } catch (error: Error | any) {
      throw new ExecuteError(`the message arguments does not match the schema: ${error.message}`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async assertValidQueryArgs(contractName: string, queryArgs: any): Promise<void> {
    const contract = this.getContractByName(contractName);
    const schemaPath = path.join(contract.root, QUERY_SCHEMA_RELATIVE_PATH);

    try {
      await this.schemaValidator.assertValidJSONSchema(schemaPath, queryArgs);
    } catch (error: Error | any) {
      throw new QueryError(`the query arguments does not match the schema: ${error.message}`);
    }
  }

  /**
   * Generate the checksum of the current optimized build of a contract
   *
   * @param contractName - Name of the contract to generate checksum of
   * @returns Promise containing the checksum
   */
  async generateChecksum(contractName: string): Promise<string> {
    const contract = this.getContractByName(contractName);

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
   * @returns An instance of {@link StoreDeployment} or undefined if not found
   */
  findStoreDeployment(contractName: string, chainId: string): StoreDeployment | undefined {
    const contract = this.getContractByName(contractName);

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
   * @returns An instance of {@link InstantiateDeployment} or undefined if not found
   */
  findInstantiateDeployment(contractName: string, chainId: string): InstantiateDeployment | undefined {
    const contract = this.getContractByName(contractName);

    return contract.deployments.find(item => {
      const pastDeploy = item as InstantiateDeployment;

      return (
        pastDeploy.contract.version === contract.version &&
        pastDeploy.action === DeploymentAction.INSTANTIATE &&
        pastDeploy.chainId === chainId
      );
    }) as InstantiateDeployment | undefined;
  }

  /**
   * Returns a list of all the last instantiated deployments of all contracts
   *
   * @param chainId - Chain id to search by
   * @returns An array of instances of {@link InstantiateDeployment}
   */
  getAllInstantiateDeployments(chainId: string): InstantiateDeployment[] {
    const instantiatedDeployments = this._data.map(
      contract =>
        contract.deployments.find(item => {
          const pastDeploy = item as InstantiateDeployment;

          return (
            pastDeploy.contract.version === contract.version &&
            pastDeploy.action === DeploymentAction.INSTANTIATE &&
            pastDeploy.chainId === chainId
          );
        }) as InstantiateDeployment | undefined
    );

    return instantiatedDeployments.filter(item => item !== undefined) as InstantiateDeployment[];
  }

  /**
   * Query the balance of contracts
   *
   * @param client - Stargate client to use when querying
   * @param instantiateDeployements - An array of instances of {@link InstantiateDeployment} to query
   * @returns Promise containing the balances result
   */
  async queryAllBalances(client: StargateClient, instantiatedDeployments: InstantiateDeployment[]): Promise<AccountBalancesJSON[]> {
    const balances = await Promise.all(instantiatedDeployments.map(item => client.getAllBalances(item.contract.address)));

    return instantiatedDeployments.map((item, index) => ({
      account: {
        name: item.contract.name,
        address: item.contract.address,
        balances: balances[index] as Coin[],
      },
    }));
  }

  /**
   * Get a formatted version of a contract balance
   *
   * @param balance - Contract balance data
   * @returns Formatted contract address balance
   */
  static prettyPrintBalances(balance: AccountBalancesJSON): string {
    return `Balances for contract ${greenBright(balance.account.name)} (${green(balance.account.address)})\n\n${prettyPrintBalancesList(
      balance.account.balances
    )}`;
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
    return `${redBright('Contract with name')} ${bold(this.contractName)} ${redBright('not found')}`;
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
    return `${redBright('Invalid cargo file')} ${bold(this.cargoFilePath)} ${redBright(
      ' please make sure it is a workspace and that'
    )} ${bold(`"${this.requiredWorkspaceMember}"`)} ${redBright("is part of the members listed in the workspace's Cargo.toml file")}`;
  }
}
