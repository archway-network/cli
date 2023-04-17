import { bold, green, red } from '../utils/style';
import { Contract } from '../types/Contract';
import { getWokspaceRoot } from '../utils/paths';
import path from 'node:path';
import { DEFAULT } from '../config';
import { ConsoleError } from '../types/ConsoleError';
import { ErrorCodes } from '../exceptions/ErrorCodes';

export class Contracts {
  private _data: Contract[];

  constructor(data: Contract[]) {
    this._data = data;
  }

  get data(): Contract[] {
    return this._data;
  }

  // to do: Add logic to read data from real files
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

  assertGetContractByName(contractName: string): void {
    if (!this.getContractByName(contractName)) throw new ContractNameNotFoundError(contractName);
  }

  getContractByName(contractName: string): Contract | undefined {
    return this._data.find(item => item.name === contractName);
  }

  static async getFilePath(contractsRelativePath?: string): Promise<string> {
    const workspaceRoot = await getWokspaceRoot();

    return path.join(workspaceRoot, contractsRelativePath || DEFAULT.ContractsRelativePath);
  }

  async prettyPrint(): Promise<string> {
    let contractsList = '';
    for (const item of this._data) {
      contractsList += `\n  ${green(item.name)} (${item.version})`;
    }

    if (!contractsList) contractsList = '(none)';

    return `${bold('Available contracts: ')}${contractsList}`;
  }
}

export class ContractNameNotFoundError extends ConsoleError {
  contractName: string;

  constructor(contractName: string) {
    super(ErrorCodes.CONTRACT_NAME_NOT_FOUND);
    this.contractName = contractName;
  }

  toConsoleString(): string {
    return `${red('Contract with name')} ${bold(this.contractName)} ${red('not found')}`;
  }
}
