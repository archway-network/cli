import { bold, red } from '@/utils/style';
import { ErrorCodes } from './ErrorCodes';

import { ConsoleError } from '@/types/ConsoleError';

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
    return `${bold(this.value)} ${red(`is not a valid${this.type ? ` ${this.type}` : ''} value`)}`;
  }
}
