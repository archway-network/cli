import { ConsoleError } from '../types/ConsoleError';
import { bold, red } from '../utils/style';

export class ChainIdNotFoundError extends ConsoleError {
  chainId: string;

  constructor(chainId: string) {
    super(3);
    this.chainId = chainId;
  }

  toConsoleString(): string {
    return `❌ ${red('Chain id')} ${bold(this.chainId)} ${red('not found')}`;
  }
}
