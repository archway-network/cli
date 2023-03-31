import { Contract } from './Contract';

export interface ConfigData {
  name: string;
  chainId: string;
  contractsPath?: string;
}

export interface ConfigDataWithContracts extends ConfigData {
  contracts: Contract[];
}
