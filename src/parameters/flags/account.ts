import { Flags } from '@oclif/core';

import { ExtendedHdPath } from '@/types';

export const AccountFlags = {
  /**
   * Hd Path flag
   */
  hdPath: Flags.custom<ExtendedHdPath>({
    description: 'HD Path of the account, following the BIP-44 standard',
    default: new ExtendedHdPath(),
    parse: (val: string): Promise<ExtendedHdPath> => Promise.resolve(new ExtendedHdPath(val)),
  })
};
