import { ConsoleError } from '../types/ConsoleError';
import { bold, red } from '../utils/style';
import { ErrorCodes } from './ErrorCodes';

export class FileAlreadyExistsError extends ConsoleError {
  filename: string;

  constructor(filename: string) {
    super(ErrorCodes.FILE_ALREADY_EXISTS);
    this.filename = filename;
  }

  toConsoleString(): string {
    return `${red('The file')} ${bold(this.filename)} ${red('already exists in this repository')}`;
  }
}
