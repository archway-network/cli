import { redBright } from '@/utils';
import { ErrorCodes } from '@/exceptions';

import { ConsoleError } from '@/types';

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
