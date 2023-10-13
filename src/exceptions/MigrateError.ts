import { redBright } from '@/utils';

import { ConsoleError } from './ConsoleError';
import { ErrorCodes } from './ErrorCodes';

/**
 * Error when migrate contract fails
 */
export class MigrateError extends ConsoleError {
  constructor(public description: string) {
    super(ErrorCodes.MIGRATE_FAILED);
  }

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    return redBright(`Failed to migrate contract: ${this.description}`);
  }
}
