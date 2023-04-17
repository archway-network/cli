import { ConsoleError } from '../types/ConsoleError';
import { red } from '../utils/style';
import { ErrorCodes } from './ErrorCodes';

export class BaseError extends ConsoleError {
  constructor() {
    super(ErrorCodes.BASE);
  }

  toConsoleString(): string {
    return red('An unexpected error happened');
  }
}
