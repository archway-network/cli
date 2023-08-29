import { bold, redBright } from '@/utils';
import { ErrorCodes } from '@/exceptions';

import { ConsoleError } from '@/types';

/**
 * Error when a value is not valid
 */
export class InvalidValueError extends ConsoleError {
  constructor(public value: string, public type?: string) {
    super(ErrorCodes.INVALID_VALUE);
  }

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    return `${bold(this.value)} ${redBright(`is not a valid${this.type ? ` ${this.type}` : ''} value`)}`;
  }
}