/* eslint-disable camelcase */
import { ChainRegistry, GLOBAL_CHAINS_PATH } from '../../src/domain';
import { jsonStringify } from '../../src/lib/json';
import { BuiltInChains } from '../../src/services';
import { CosmosChain } from '../../src/types';

import integrationTestChainSpec from '../../scripts/local-1.json';

export const chainFile = integrationTestChainSpec as CosmosChain;

export const chainString = jsonStringify(chainFile);

export const chainNames = ['constantine-3', 'titus-1'];

export const chainRegistryInstance = new ChainRegistry(
  GLOBAL_CHAINS_PATH,
  [...Object.values({ ...BuiltInChains.chainMap })],
  []
);
