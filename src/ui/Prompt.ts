import _ from 'lodash';
import { prompt, prompts, inject, override, PromptObject, Answers, Options } from 'prompts';
import { ConsoleError } from '../types/ConsoleError';
import { red } from '../utils/style';
import { ErrorCodes } from '../exceptions/ErrorCodes';

const onCancel = () => {
  throw new PromptCancelledError();
};

export const showPrompt = async (questions: PromptObject | PromptObject[], options?: Options): Promise<Answers<any>> => {
  return prompt(questions, { onSubmit: options?.onSubmit || _.noop, onCancel: options?.onCancel || onCancel });
};

export class PromptCancelledError extends ConsoleError {
  constructor() {
    super(ErrorCodes.PROMPT_CANCELLED);
  }

  toConsoleString(): string {
    return `${red('Prompt cancelled')}`;
  }
}

export { prompts, inject, override };
