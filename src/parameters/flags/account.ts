import { Flags } from '@oclif/core';
import { HdPath } from '@cosmjs/crypto';

import { makeCosmosDerivationPath } from '@/utils';

const HdPathFlagDescription = 'HD path of the account, numbers separated by / (Defaults to 118/0/0/0)';

/**
 * Definition of Amount optional flag
 */
export const ParamsHdPathOptionalFlag = {
  description: HdPathFlagDescription,
  parse: async (val: string): Promise<HdPath> => {
    const received = val
      .split('/')
      .map(item => Number(item))
      .filter(Boolean);

    const pathValues = [...Array.from({ length: 4 - received.length }), ...received];

    return makeCosmosDerivationPath(...(pathValues as Array<number | undefined>));
  },
};

/**
 * Hd Path optional flag
 */
export const HdPathOptionalFlag = Flags.custom<HdPath>(ParamsHdPathOptionalFlag)();
