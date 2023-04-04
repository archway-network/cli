import { bold, green } from '../utils/style';
import { Contract } from '../types/Contract';
import { getWokspaceRoot } from '../utils/paths';
import path from 'node:path';
import { DEFAULT } from '../config';

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
        name: 'increment',
        version: '0.1.0',
      },
      {
        name: 'my-nft',
        version: '0.1.3',
      },
    ]);
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
