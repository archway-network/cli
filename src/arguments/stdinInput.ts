import { Args } from '@oclif/core';

/**
 * Definition of Standard input argument
 */
export const ParamsStdinInputArg = {
  name: 'piped',
  required: false,
  hidden: true,
};

/**
 * Standard input argument
 */
export const StdinInputArg = Args.string(ParamsStdinInputArg);
