import { Flags } from '@oclif/core';
import { AlphabetLowercase } from '@oclif/core/lib/interfaces';

const GlobalFlagDescription = 'Sets the config in the global config file';

/**
 * Definition of global flag
 */
export const ParamsGlobalFlag = {
  description: GlobalFlagDescription,
  char: 'g' as AlphabetLowercase,
  default: false,
};

/**
 * Global flag
 */
export const GlobalFlag = Flags.boolean(ParamsGlobalFlag);
