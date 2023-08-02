import { bold, red } from '@/utils/style';
import { ErrorCodes } from './ErrorCodes';

import { ConsoleError } from '@/types/ConsoleError';

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
    return `${red(this.description)}${this.valueSearched ? bold(` ${this.valueSearched}`) : ''} ${red('already exists')}`;
  }
}
