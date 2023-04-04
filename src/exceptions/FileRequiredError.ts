import { ConsoleError } from '../types/ConsoleError';
import { red } from '../utils/style';

export class FileRequiredError extends ConsoleError {
  constructor() {
    super(6);
  }

  toConsoleString(): string {
    return `❌ ${red('Please specify the file')}`;
  }
}
