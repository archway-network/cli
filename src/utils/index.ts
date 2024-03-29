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
  APPEND = 'APPEND',
  OVERWRITE = 'OVERWRITE',
  PREPEND = 'PREPEND',
}

/**
 * Util function that customizes merging of objects, used as parameter of lodash's 'mergeWith' function
 *
 * @param arrayMergeMode - Optional - Merge mode to be used
 * @returns Merged object
 */
export function mergeCustomizer(arrayMergeMode = MergeMode.OVERWRITE): any {
  /* eslint-disable @typescript-eslint/unbound-method */
  return _.cond([
    [_.overEvery(_.isArray, _.constant(arrayMergeMode === MergeMode.OVERWRITE)), _.nthArg(1)],
    [_.overEvery(_.isArray, _.constant(arrayMergeMode === MergeMode.APPEND)), _.concat],
    [
      _.overEvery(_.isArray, _.constant(arrayMergeMode === MergeMode.PREPEND)),
      (objValue = [], srcValue = []) => [...srcValue, ...objValue],
    ],
  ]);
  /* eslint-enable @typescript-eslint/unbound-method */
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
