import { Flags } from '@oclif/core';
import { AlphabetLowercase } from '@oclif/core/lib/interfaces';

import { Amount } from '@/types';

import { parseAmount } from '../shared/amount';

import { NoConfirmFlag } from './noConfirm';

const FromDescription = 'Signer of the tx';
const FeeDescription = 'Extra fees to pay along with the transaction';
const FeeAccountDescription = 'Account used to pay fees for the transaction instead of the signer';
const GasAdjustmentDescription = 'Multiplier that is applied to the default estimated gas to avoid running out of gas exceptions';

const HelpGroup = 'Transaction';

/**
 * Definition of Transaction From flag
 */
export const ParamsTransactionFromFlag = {
  description: FromDescription,
  char: 'f' as AlphabetLowercase,
  helpGroup: HelpGroup
};

/**
 * Transaction From flag
 */
export const TransactionFromFlag = Flags.string(ParamsTransactionFromFlag);

/**
 * Definition of Transaction Fee flag
 */
export const ParamsTransactionFeeFlag = {
  description: FeeDescription,
  parse: async (val: string): Promise<Amount> => parseAmount(val),
  helpGroup: HelpGroup
};

/**
 * Transaction Fee flag
 */
export const TransactionFeeFlag = Flags.custom<Amount>(ParamsTransactionFeeFlag)();

/**
 * Definition of Transaction Fee Account flag
 */
export const ParamsTransactionFeeAccountFlag = {
  description: FeeAccountDescription,
  helpGroup: HelpGroup
};

/**
 * Transaction Fee Account flag
 */
export const TransactionFeeAccountFlag = Flags.string(ParamsTransactionFeeAccountFlag);

/**
 * Definition of Transaction Gas Adjustment flag
 */
export const ParamsTransactionGasAdjustmentFlag = {
  default: 1.3,
  description: GasAdjustmentDescription,
  parse: async (val: string): Promise<number> => Number(val),
  helpGroup: HelpGroup
};

/**
 * Transaction Gas Adjustment flag
 */
export const TransactionGasAdjustmentFlag = Flags.custom<number>(ParamsTransactionGasAdjustmentFlag);

/**
 * All of the Transaction related flags
 */
export const TransactionFlags = {
  from: TransactionFromFlag,
  fee: TransactionFeeFlag,
  // Currently not being used anywhere, commenting out so it doesn't appear on the helper
  // 'fee-account': TransactionFeeAccountFlag,
  'no-confirm': NoConfirmFlag,
  // eslint-disable-next-line new-cap
  'gas-adjustment': TransactionGasAdjustmentFlag(),
};
