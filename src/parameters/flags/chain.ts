import { Flags } from '@oclif/core';

import { parseChainId } from '../shared/chain';

export const ChainFlags = {
  /**
   * Flag that validates a chain ID
   */
  chainId: Flags.custom<string>({
    description: 'ID of the chain',
    parse: parseChainId,
  })
};
