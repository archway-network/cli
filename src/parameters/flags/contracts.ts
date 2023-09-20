import { Flags } from '@oclif/core';

const SkipValidationDescription = 'Skip schema validation of the arguments';

/**
 * Definition of Amount optional flag
 */
export const ParamsSkipValidationFlag = {
  description: SkipValidationDescription,
  default: false
};

/**
 * Amount optional flag
 */
export const SkipValidationFlag = Flags.boolean(ParamsSkipValidationFlag);
