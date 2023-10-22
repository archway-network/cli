import { Args } from '@oclif/core';

import { parseChainId } from '../shared/chain';

export const ChainArgs = {
  /**
   * Argument that validates a chain ID
   */
  chainId: Args.custom<string>({
    description: 'ID of the chain',
    parse: parseChainId,
  })
};
