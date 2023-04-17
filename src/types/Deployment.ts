import { Coin } from './Coin';

export interface DeploymentFile {
  deployments: Deployment[];
}

export interface Deployment {
  action: DeploymentAction;
  txhash: string;
  wasm: Wasm;
  contract: Contract;
  metadata?: Metadata;
  msg?: Msg;
  flatFee?: Coin;
}

export interface Wasm {
  codeId: number;
  checksum?: string;
}

export interface Contract {
  name: string;
  version: string;
  address?: string;
  admin?: string;
}

export interface Metadata {
  ownerAddress: string;
  rewardsAddress: string;
}

export interface Msg {
  count: number;
}

export enum DeploymentAction {
  STORE = 'store',
  INSTANTIATE = 'instantiate',
  METADATA = 'metadata',
  PREMIUM = 'premium',
}
