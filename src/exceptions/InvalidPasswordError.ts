import { redBright } from '@/utils';

import { ConsoleError } from './ConsoleError';
import { ErrorCodes } from './ErrorCodes';

/**
 * Error when a password is not valid
 */
export class InvalidPasswordError extends ConsoleError {
  constructor(public relatedName?: string) {
    super(ErrorCodes.INVALID_PASSWORD);
  }

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    return `${redBright(`Invalid password${this.relatedName ? ` for ${this.relatedName}` : ''}`)}`;
  }
}
