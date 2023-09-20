import _ from 'lodash';
import { Answers, Options, PromptObject, inject, override, prompt, prompts } from 'prompts';

import { ConsoleError, ErrorCodes } from '@/exceptions';
import { yellow } from '@/utils';

/**
 * Display a prompt to the user to enter a value or select an option
 *
 * @param questions - A single {@link Prompt} or an array of it, that will be prompted to the user
 * @param options - Optional - Prompt options
 * @returns Promise containing the values that were input by the user
 */
export const showPrompt = async (questions: PromptObject | PromptObject[], options?: Options): Promise<Answers<any>> => {
  return prompt(questions, { onSubmit: options?.onSubmit || _.noop, onCancel: options?.onCancel || onCancel });
};

/**
 * Handle user canceling the prompt
 */
const onCancel = () => {
  throw new PromptCanceledError();
};

/**
 * Error when a prompt is canceled by the user
 */
export class PromptCanceledError extends ConsoleError {
  constructor() {
    super(ErrorCodes.PROMPT_CANCELED);
  }

  /**
   * {@inheritDoc ConsoleError.toConsoleString}
   */
  toConsoleString(): string {
    return `${yellow('Operation canceled')}`;
  }
}

export { inject, override, prompts };
