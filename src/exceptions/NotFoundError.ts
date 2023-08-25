import { bold, redBright } from '@/utils';
import { ErrorCodes } from '@/exceptions';

import { ConsoleError } from '@/types';

/**
 * Error when something was not found
 */
export class NotFoundError extends ConsoleError {
  constructor(public description: string, public valueSearched?: string) {
    super(ErrorCodes.NOT_FOUND);
  }

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    return `${redBright(this.description)}${this.valueSearched ? bold(` ${this.valueSearched}`) : ''} ${redBright('not found')}`;
  }
}
