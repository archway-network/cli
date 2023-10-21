import { Flags } from '@oclif/core';

import { ExtendedHdPath } from '@/types';

export namespace CustomFlags {
  /**
   * Hd Path optional flag
   */
  export const hdPath = Flags.custom<ExtendedHdPath>({
    description: 'HD Path of the account, following the BIP-44 standard',
    default: new ExtendedHdPath(),
    parse: async (val: string): Promise<ExtendedHdPath> => new ExtendedHdPath(val),
  });
}
