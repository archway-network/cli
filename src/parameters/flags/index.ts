import { AccountFlags } from './account';
import { AmountFlags } from './amount';
import { ChainFlags } from './chain';

export * from './chain';
export * from './config';
export * from './contracts';
export * from './keyring';
export * from './msgArgs';
export * from './noConfirm';
export * from './template';
export * from './transaction';

export const CustomFlags = {
  ...AccountFlags,
  ...AmountFlags,
  ...ChainFlags,
  // ...ConfigFlags,
  // ...ContractFlags,
  // ...KeyringFlags,
  // ...MsgFlags,
  // ...NoConfirmFlags,
  // ...TemplateFlags,
  // ...TransactionFlags,
};
