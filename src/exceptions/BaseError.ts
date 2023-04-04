import { ConsoleError } from '../types/ConsoleError';
import { red } from '../utils/style';

export class BaseError extends ConsoleError {
  constructor() {
    super(0);
  }

  toConsoleString(): string {
    return `❌ ${red('Unexpected error happened')}`;
  }
}
