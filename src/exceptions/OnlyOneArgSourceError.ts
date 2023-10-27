import { redBright } from '@/utils';

import { ConsoleError } from './ConsoleError';
import { ErrorCodes } from './ErrorCodes';

/**
 * Error when user tries to input an arg from many sources
 */
export class OnlyOneArgSourceError extends ConsoleError {
  constructor(public args: readonly string[]) {
    super(ErrorCodes.ONLY_ONE_ARG_SOURCE);
  }

  toConsoleString(): string {
    return redBright(`Please specify only one of ${this.args.join(',')} as an argument`);
  }
}
