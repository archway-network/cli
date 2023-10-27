import { redBright } from '@/utils';

import { ConsoleError } from './ConsoleError';
import { ErrorCodes } from './ErrorCodes';

/**
 * Error when execute contract fails
 */
export class ExecuteError extends ConsoleError {
  constructor(public description: string) {
    super(ErrorCodes.INSTANTIATE_FAILED);
  }

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    return redBright(`Failed to execute contract: ${this.description}`);
  }
}
