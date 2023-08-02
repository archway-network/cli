import path from 'node:path';

import { bold, green, red } from '@/utils/style';
import { Contract } from '@/types/Contract';
import { getWokspaceRoot } from '@/utils/paths';
import { DEFAULT } from '@/config';
import { ConsoleError } from '@/types/ConsoleError';
import { ErrorCodes } from '@/exceptions/ErrorCodes';

/**
 * Manages the contracts' data in the project
 */
export class Contracts {
  private _data: Contract[];

  /**
   * @param data - Array of {@link Contract}
   */
  constructor(data: Contract[]) {
    this._data = data;
  }

  get data(): Contract[] {
    return this._data;
  }

  /**
   * Open the contract files in the project
   *
   * @param contractsRelativePath - Optional - Relative path where the contracts are in the project
   * @returns Promise containing an instance of {@link Contracts}
   */
  // TO DO: Add logic to read data from real files
  static async open(contractsRelativePath?: string): Promise<Contracts> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _filePath = await this.getFilePath(contractsRelativePath);

    return new Contracts([
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
    ]);
  }

  /**
   * Get the absolute path of the contracts file
   *
   * @param contractsRelativePath - Optional - Relative path of the contracts data file
   * @returns Promise containing the absolute path of the contracts file
   */
  static async getFilePath(contractsRelativePath?: string): Promise<string> {
    const workspaceRoot = await getWokspaceRoot();

    return path.join(workspaceRoot, contractsRelativePath || DEFAULT.ContractsRelativePath);
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
