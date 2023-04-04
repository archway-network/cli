import _ from 'lodash';
import promptsMain, { prompts, inject, override, PromptObject, Answers, Options } from 'prompts';
import { PromptCancelledError } from '../exceptions';

const onCancel = () => {
  throw new Error(new PromptCancelledError().toConsoleString());
};

export const showPrompt = async (questions: PromptObject | PromptObject[], options?: Options): Promise<Answers<any>> => {
  return promptsMain(questions, { onSubmit: options?.onSubmit || _.noop, onCancel: options?.onCancel || onCancel });
};

export { prompts, inject, override };
