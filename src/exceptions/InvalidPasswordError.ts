import { red } from '@/utils/style';
import { ErrorCodes } from './ErrorCodes';

import { ConsoleError } from '@/types/ConsoleError';

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
