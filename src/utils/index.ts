import _ from 'lodash';

import { MergeMode } from '../types/utils';

/**
 * Util function that customizes merging of objects, used as parameter of lodash's 'mergeWith' function
 *
 * @param arrayMergeMode - Optional - Merge mode to be used
 * @returns Merged object
 */
export const mergeCustomizer = (arrayMergeMode = MergeMode.OVERWRITE): any => {
  return _.cond([
    [_.overEvery(_.isArray, _.constant(arrayMergeMode === MergeMode.OVERWRITE)), _.nthArg(1)],
    [_.overEvery(_.isArray, _.constant(arrayMergeMode === MergeMode.APPEND)), _.concat],
    [
      _.overEvery(_.isArray, _.constant(arrayMergeMode === MergeMode.PREPEND)),
      (objValue = [], srcValue = []) => [...srcValue, ...objValue],
    ],
  ]);
};
