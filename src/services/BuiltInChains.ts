import ArchwaySchema from '@/repositories/chain-registry/archway-1.json';
import ConstantineSchema from '@/repositories/chain-registry/constantine-3.json';
import { CosmosChain } from '@/types';

/**
 * Class containing data from the built-in chains
 */
// eslint-disable-next-line unicorn/no-static-only-class
export class BuiltInChains {
  static chainMap: Record<string, CosmosChain> = {
    'constantine-3': ConstantineSchema as CosmosChain,
    'archway-1': ArchwaySchema as CosmosChain,
  };

  /**
   * Get a {@link CosmosChain} object, by the chain id
   *
   * @param chainId - Chain id that we are looking for
   * @returns A {@link CosmosChain} instance, or undefined if not found
   */
  static getChainById(chainId: string): CosmosChain | undefined {
    return this.chainMap[chainId];
  }

  /**
   * Get all the built-in chain ids
   *
   * @returns Array of the chain ids
   */
  static getChainIds(): readonly string[] {
    return Object.keys(this.chainMap);
  }

  /**
   * Get the built-in chains data
   *
   * @returns Array containing the {@link CosmosChain} representation of the built-in chains
   */
  static getChainList(): readonly CosmosChain[] {
    return Object.values(this.chainMap);
  }
}
