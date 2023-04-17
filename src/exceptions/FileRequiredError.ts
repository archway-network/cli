import { ConsoleError } from '../types/ConsoleError';
import { red } from '../utils/style';
import { ErrorCodes } from './ErrorCodes';

export class FileRequiredError extends ConsoleError {
  constructor() {
    super(ErrorCodes.FILE_REQUIRED);
  }

  toConsoleString(): string {
    return `${red('Please specify the file')}`;
  }
}
