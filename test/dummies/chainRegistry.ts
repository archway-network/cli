/* eslint-disable camelcase */
import { ChainRegistry, GLOBAL_CHAINS_PATH } from '../../src/domain';
import { BuiltInChains } from '../../src/services';
import { CosmosChain } from '../../src/types';

import integrationTestChainSpec from '../fixtures/integration-test-1.json';

export const chainFile = integrationTestChainSpec as CosmosChain;

export const chainString = JSON.stringify(chainFile);

export const chainNames = ['constantine-3', 'titus-1'];

export const chainRegistryInstance = new ChainRegistry(
  GLOBAL_CHAINS_PATH,
  [...Object.values({ ...BuiltInChains.chainMap })],
  []
);
