import { redBright } from '@/utils';

import { ConsoleError } from './ConsoleError';
import { ErrorCodes } from './ErrorCodes';

/**
 * Error when contract query fails
 */
export class QueryError extends ConsoleError {
  constructor(public description: string) {
    super(ErrorCodes.QUERY_FAILED);
  }

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    return redBright(`Failed to query contract: ${this.description}`);
  }
}
