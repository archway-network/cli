import path from 'node:path';

import { bold, green, red } from '@/utils/style';
import { Contract } from '@/types/Contract';
import { getWorkspaceRoot } from '@/utils/paths';
import { DEFAULT, REPOSITORIES } from '@/config';
import { ConsoleError } from '@/types/ConsoleError';
import { ErrorCodes } from '@/exceptions/ErrorCodes';
import { Cargo } from './Cargo';

/**
 * Manages the contracts' data in the project
 */
export class Contracts {
  private _data: Contract[];
  private _contractsPath: string;

  /**
   * @param data - Array of {@link Contract}
   * @param contractsPath - Path of the directory where contracts will be found
   */
  constructor(data: Contract[], contractsPath: string) {
    this._data = data;
    this._contractsPath = contractsPath;
  }

  get data(): Contract[] {
    return this._data;
  }

  get contractsPath(): string {
    return this._contractsPath;
  }

  /**
   * Open the contract files in the project
   *
   * @param contractsRelativePath - Optional - Relative path where the contracts are in the project
   * @returns Promise containing an instance of {@link Contracts}
   */
  // TO DO: Add logic to read data from real files
  static async open(contractsRelativePath?: string): Promise<Contracts> {
    const contractsPath = await this.getFilePath(contractsRelativePath);

    return new Contracts(
      [
        {
          name: 'my-contract',
          version: '0.1.0',
        },
        {
          name: 'my-contract-2',
          version: '0.1.0',
        },
        {
          name: 'my-contract-3',
          version: '0.1.0',
        },
        {
          name: 'increment',
          version: '0.1.0',
        },
        {
          name: 'my-nft',
          version: '0.1.3',
        },
      ],
      contractsPath
    );
  }

  /**
   * Get the absolute path of the contracts file
   *
   * @param contractsRelativePath - Optional - Relative path of the contracts data file
   * @returns Promise containing the absolute path of the contracts file
   */
  static async getFilePath(contractsRelativePath?: string): Promise<string> {
    const workspaceRoot = await getWorkspaceRoot();

    return path.join(workspaceRoot, contractsRelativePath || DEFAULT.ContractsRelativePath);
  }

  /**
   * Create a new contract from one of the archway templates
   *
   * @param name - Contract name
   * @param template - Name of the template to use
   */
  async new(name: string, template: string): Promise<void> {
    const cargo = new Cargo();
    await cargo.generate({
      name,
      repository: REPOSITORIES.Templates,
      branch: DEFAULT.TemplateBranch,
      template: template,
      destinationDir: this.contractsPath,
    });
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
   * @returns void
   */
  assertGetContractByName(contractName: string): void {
    if (!this.getContractByName(contractName)) throw new ContractNameNotFoundError(contractName);
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
