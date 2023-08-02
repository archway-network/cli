import { red } from '@/utils';
import { ErrorCodes } from '@/exceptions';

import { ConsoleError } from '@/types';

/**
 * Error when user tries to input an arg from many sources
 */
export class OnlyOneArgSourceError extends ConsoleError {
  constructor(public name: string) {
    super(ErrorCodes.ONLY_ONE_ARG_SOURCE);
  }

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    return `${red(`Please specify only one ${this.name} args input`)}`;
  }
}
