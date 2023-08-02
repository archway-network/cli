import { red } from '@/utils';
import { ErrorCodes } from '@/exceptions';

import { ConsoleError } from '@/types';

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
    return `${red(`Invalid password${this.relatedName ? ` for ${this.relatedName}` : ''}`)}`;
  }
}
