import { bold, redBright } from '@/utils';

import { ConsoleError } from './ConsoleError';
import { ErrorCodes } from './ErrorCodes';

/**
 * Error when something was not found
 */
export class NotFoundError extends ConsoleError {
  constructor(public description: string, public valueSearched?: string) {
    super(ErrorCodes.NOT_FOUND);
  }

  toConsoleString(): string {
    return `${redBright(this.description)}${this.valueSearched ? bold(` ${this.valueSearched}`) : ''} ${redBright('not found')}`;
  }
}
