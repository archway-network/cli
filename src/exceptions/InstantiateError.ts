import { redBright } from '@/utils';

import { ConsoleError } from './ConsoleError';
import { ErrorCodes } from './ErrorCodes';

/**
 * Error when instantiate contract fails
 */
export class InstantiateError extends ConsoleError {
  constructor(public description: string) {
    super(ErrorCodes.INSTANTIATE_FAILED);
  }

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    return redBright(`Failed to instantiate contract: ${this.description}`);
  }
}
