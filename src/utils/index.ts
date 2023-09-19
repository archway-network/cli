import _ from 'lodash';

export * from './accounts';
export * from './coin';
export * from './filesystem';
export * from './paths';
export * from './style';
export * from './transactions';

/**
 * Possible merge modes on object update
 */
export enum MergeMode {
  OVERWRITE = 'OVERWRITE',
  APPEND = 'APPEND',
  PREPEND = 'PREPEND',
}

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
