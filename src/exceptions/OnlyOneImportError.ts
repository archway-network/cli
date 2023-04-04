import { ConsoleError } from '../types/ConsoleError';
import { red } from '../utils/style';

export class OnlyOneImportError extends ConsoleError {
  constructor() {
    super(5);
  }

  toConsoleString(): string {
    return `❌ ${red('Please specify only one file to import')}`;
  }
}
