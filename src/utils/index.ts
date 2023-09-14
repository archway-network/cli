import _ from 'lodash';

import { Prompts } from '@/services';
import { PromptCanceledError } from '@/ui';

import { MergeMode } from '@/types';

export * from './accounts';
export * from './coin';
export * from './filesystem';
export * from './paths';
export * from './sanitize';
export * from './style';
export * from './transactions';

/**
 * Util function that customizes merging of objects, used as parameter of lodash's 'mergeWith' function
 *
 * @param arrayMergeMode - Optional - Merge mode to be used
 * @returns Merged object
 */
export function mergeCustomizer(arrayMergeMode = MergeMode.OVERWRITE): any {
  return _.cond([
    [_.overEvery(_.isArray, _.constant(arrayMergeMode === MergeMode.OVERWRITE)), _.nthArg(1)],
    [_.overEvery(_.isArray, _.constant(arrayMergeMode === MergeMode.APPEND)), _.concat],
    [
      _.overEvery(_.isArray, _.constant(arrayMergeMode === MergeMode.PREPEND)),
      (objValue = [], srcValue = []) => [...srcValue, ...objValue],
    ],
  ]);
}

/**
 * Util function to ask for confirmation
 *
 * @param skipConfirmation - Optional - Skips the confirmation prompt
 */
export async function askForConfirmation(force = false): Promise<void> {
  if (force) {
    return;
  }

  const promptedConfirmation = await Prompts.confirmation();
  if (!promptedConfirmation) {
    throw new PromptCanceledError()
  }
}
