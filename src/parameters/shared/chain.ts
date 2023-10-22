import { ChainRegistry } from '@/domain';

/**
 * Util function to validate if a chain id exists in the local registry, throws error if not
 *
 * @param value - Chain id to validate
 * @returns Promise containing the chain id
 */
export async function parseChainId(value: string): Promise<string> {
  const chainRegistry = await ChainRegistry.init();
  chainRegistry.assertGetChainById(value);

  return value;
}
