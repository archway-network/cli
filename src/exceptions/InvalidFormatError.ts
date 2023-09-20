import { bold, redBright } from '@/utils';

import { ConsoleError } from './ConsoleError';
import { ErrorCodes } from './ErrorCodes';

/**
 * Error when the format of a file or object is not valid
 */
export class InvalidFormatError extends ConsoleError {
  constructor(public name: string, public readonly validationErrors?: ReadonlyMap<string, Set<string>>) {
    super(ErrorCodes.INVALID_FORMAT);
  }

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    const message = `${bold(this.name)} ${redBright("doesn't have a valid format")}`;
    return `${message}${this.formatValidationErrors()}`;
  }

  private formatValidationErrors(): string {
    if (!this.validationErrors) {
      return '';
    }

    const lines: string[] = [];
    for (const [key, errors] of this.validationErrors!) {
      lines.push(`  - ${key}:`);
      for (const error of errors) {
        lines.push(`    - ${error}`)
      }
    }

    return lines.join('\n');
  }
}
