import { ConsoleError } from '@/types/ConsoleError';
import { red } from '@/utils/style';
import { ErrorCodes } from './ErrorCodes';

/**
 * Base Error with no additional details
 */
export class BaseError extends ConsoleError {
  constructor() {
    super(ErrorCodes.BASE);
  }

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    return red('An unexpected error happened');
  }
}
