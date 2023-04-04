import { ConsoleError } from '../types/ConsoleError';
import { bold, red } from '../utils/style';

export class ContractNameNotFoundError extends ConsoleError {
  contractName: string;

  constructor(contractName: string) {
    super(4);
    this.contractName = contractName;
  }

  toConsoleString(): string {
    return `❌ ${red('Contract with name')} ${bold(this.contractName)} ${red('not found')}`;
  }
}
