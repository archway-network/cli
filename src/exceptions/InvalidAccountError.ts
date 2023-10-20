import { bold, redBright } from '@/utils';

import { ConsoleError } from './ConsoleError';
import { ErrorCodes } from './ErrorCodes';

/**
 * Thrown when an account is in an invalid state
 */
export class InvalidAccountError extends ConsoleError {
  constructor(public description: string, public nameOrAddress: string) {
    super(ErrorCodes.INVALID_ACCOUNT);
  }

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    return redBright(`${this.description} (account: ${bold(this.nameOrAddress)})`);
  }
}
