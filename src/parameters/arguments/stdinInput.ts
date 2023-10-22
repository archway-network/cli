import { Args } from '@oclif/core';

/**
 * Standard input argument
 */
export const StdinInputArg = Args.string({
  name: 'stdInput',
  required: false,
  hidden: true,
});
