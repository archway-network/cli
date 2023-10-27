import { bold, redBright } from '@/utils';

import { ConsoleError } from './ConsoleError';
import { ErrorCodes } from './ErrorCodes';

/**
 * Error when a value already exists
 */
export class AlreadyExistsError extends ConsoleError {
  constructor(public description: string, public valueSearched?: string) {
    super(ErrorCodes.ALREADY_EXISTS);
  }

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    return `${redBright(this.description)}${this.valueSearched ? bold(` ${this.valueSearched}`) : ''} ${redBright('already exists')}`;
  }
}
