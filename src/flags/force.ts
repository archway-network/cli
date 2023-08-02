import { Flags } from '@oclif/core';
import { AlphabetLowercase } from '@oclif/core/lib/interfaces';

const ForceFlagDescription = "Forces execution (don't show confirmation prompt)";

/**
 * Definition of Force flag
 */
export const ParamsForceFlag = {
  description: ForceFlagDescription,
  char: 'f' as AlphabetLowercase,
};

/**
 * Force flag
 */
export const ForceFlag = Flags.boolean(ParamsForceFlag);
