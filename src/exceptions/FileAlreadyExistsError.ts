import { ConsoleError } from '../types/ConsoleError';
import { bold, red } from '../utils/style';
import { ErrorCodes } from './ErrorCodes';

/**
 * Error when a file already exists
 */
export class FileAlreadyExistsError extends ConsoleError {
  constructor(public filename: string) {
    super(ErrorCodes.FILE_ALREADY_EXISTS);
  }

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    return `${red('The file')} ${bold(this.filename)} ${red('already exists in this repository')}`;
  }
}
