import { AmountArgs } from './amount';
import { ChainArgs } from './chain';

export * from './account';
export * from './contract';
export * from './stdinInput';

export const CustomArgs = {
  // ...AccountArgs,
  ...AmountArgs,
  ...ChainArgs,
  // ...ContractArgs,
  // ...StdinArgs,
};
