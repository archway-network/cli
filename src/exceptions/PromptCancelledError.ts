import { ConsoleError } from '../types/ConsoleError';
import { red } from '../utils/style';

export class PromptCancelledError extends ConsoleError {
  constructor() {
    super(2);
  }

  toConsoleString(): string {
    return `❌ ${red('Prompt cancelled')}`;
  }
}
