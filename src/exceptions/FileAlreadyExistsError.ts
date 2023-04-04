import { ConsoleError } from '../types/ConsoleError';
import { bold, red } from '../utils/style';

export class FileAlreadyExistsError extends ConsoleError {
  filename: string;

  constructor(filename: string) {
    super(1);
    this.filename = filename;
  }

  toConsoleString(): string {
    return `❌ ${red('The file')} ${bold(this.filename)} ${red('already exists in this repository')}`;
  }
}
