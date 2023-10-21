import ArchwaySchema from '@/repositories/chainSchemas/archway-1.json';
import ConstantineSchema from '@/repositories/chainSchemas/constantine-3.json';
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
   * @returns {@link CosmosChain} instance found, or undefined if not found
   */
  static getChainById(chainId: string): CosmosChain | undefined {
    return this.chainMap[chainId];
  }

  /**
   * Get all the built-in chain ids
   *
   * @returns Array of the chain ids
   */
  static getChainIds(): string[] {
    return Object.keys(this.chainMap);
  }

  /**
   * Get the built-in chains data
   *
   * @returns Array containing the {@link CosmosChain} representation of the built-in chains
   */
  static getChainList(): CosmosChain[] {
    return Object.values(this.chainMap);
  }
}
