import { CosmosChain } from '../types/Chain/CosmosSchema';
import ConstantineSchema from '../repositories/ChainSchemas/constantine.json';
import TitusSchema from '../repositories/ChainSchemas/titus.json';
import LocalSchema from '../repositories/ChainSchemas/local.json';

export class Chain {
  private static chainMap: Record<string, CosmosChain> = {
    'constantine-1': ConstantineSchema as CosmosChain,
    'titus-1': TitusSchema as CosmosChain,
    'local-1': LocalSchema as CosmosChain,
  };

  static getChainById(chainId: string): CosmosChain | undefined {
    return this.chainMap[chainId];
  }

  static getChainIds(): string[] {
    return Object.keys(this.chainMap);
  }
}
