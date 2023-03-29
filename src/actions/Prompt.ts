import _ from 'lodash';
import promptsMain, { prompts, inject, override, PromptObject, Answers, Options } from 'prompts';

export class PromptCancelledError extends Error {}

const onCancel = () => {
  throw new PromptCancelledError('Cancelled');
};

export const showPrompt = async (questions: PromptObject | PromptObject[], options?: Options): Promise<Answers<any>> => {
  return promptsMain(questions, { onSubmit: options?.onSubmit || _.noop, onCancel: options?.onCancel || onCancel });
};

export { prompts, inject, override };
