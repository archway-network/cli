import { Flags } from '@oclif/core';

const NoValidationDescription = 'Skip schema validation of the arguments';

/**
 * Definition of no-validation flag
 */
export const ParamsNoValidationFlag = {
  description: NoValidationDescription,
};

/**
 * No-validation flag
 */
export const NoValidationFlag = Flags.boolean(ParamsNoValidationFlag);
