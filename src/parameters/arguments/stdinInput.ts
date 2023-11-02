import { Args } from '@oclif/core';

/**
 * Definition of Standard input argument
 */
export const ParamsStdinInputArg = {
  name: 'stdInput',
  required: false,
  hidden: true,
};

/**
 * Standard input argument
 */
export const StdinInputArg = Args.string(ParamsStdinInputArg);
