import { ConsoleError } from '@/types/ConsoleError';
import { bold, red } from '@/utils/style';
import { ErrorCodes } from './ErrorCodes';

/**
 * Error when a file already exists
 */
export class NotFoundError extends ConsoleError {
  constructor(public description: string, public valueSearched: string) {
    super(ErrorCodes.NOT_FOUND);
  }

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    return `${red(this.description)} ${bold(this.valueSearched)} ${red('not found')}`;
  }
}
