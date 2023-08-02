import { red } from '@/utils';
import { ErrorCodes } from '@/exceptions';

import { ConsoleError } from '@/types';

/**
 * Base Error with no additional details
 */
export class BaseError extends ConsoleError {
  constructor(public customMessage?: string) {
    super(ErrorCodes.BASE);
  }

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    return red(this.customMessage || 'An unexpected error happened');
  }
}
