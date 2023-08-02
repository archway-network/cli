import { ConsoleError } from '@/types/ConsoleError';
import { bold, red } from '@/utils/style';
import { ErrorCodes } from './ErrorCodes';

/**
 * Error when the format of a file or object is not valid
 */
export class InvalidFormatError extends ConsoleError {
  constructor(public name: string) {
    super(ErrorCodes.INVALID_FORMAT);
  }

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    return `${bold(this.name)} ${red("doesn't have a valid format")}`;
  }
}
