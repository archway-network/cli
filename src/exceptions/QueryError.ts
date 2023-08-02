import { red } from '@/utils';
import { ErrorCodes } from '@/exceptions';

import { ConsoleError } from '@/types';

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
    return red(`Failed to query contract: ${this.description}`);
  }
}
