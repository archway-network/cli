import { Flags } from '@oclif/core';
import { AlphabetLowercase } from '@oclif/core/lib/interfaces';

import { parseAmount } from '@/utils';

import { Amount } from '@/types';

const FromDescription = 'Signer of the tx';
const FeeDescription = 'Extra fees to pay along with the transaction';
const FeeAccountDescription = 'Account used to pays fees for the transaction instead of the signer';
const ConfirmDescription = 'Asks for confirmation before broadcasting the tx or skips the prompt completely';
const GasAdjustmentDescription = 'Asks for confirmation before broadcasting the tx or skips the prompt completely';

/**
 * Definition of Transaction From flag
 */
export const ParamsTransactionFromFlag = {
  description: FromDescription,
  char: 'f' as AlphabetLowercase,
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
};

/**
 * Transaction Fee Account flag
 */
export const TransactionFeeAccountFlag = Flags.string(ParamsTransactionFeeAccountFlag);

/**
 * Definition of Transaction Confirm flag
 */
export const ParamsTransactionConfirmFlag = {
  default: true,
  description: ConfirmDescription,
  allowNo: true,
};

/**
 * Transaction Confirm flag
 */
export const TransactionConfirmFlag = Flags.boolean(ParamsTransactionConfirmFlag);

/**
 * Definition of Transaction Gas Adjustment flag
 */
export const ParamsTransactionGasAdjustmentFlag = {
  default: 1.3,
  description: GasAdjustmentDescription,
  parse: async (val: string): Promise<number> => Number(val),
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
  confirm: TransactionConfirmFlag,
  // eslint-disable-next-line new-cap
  'gas-adjustment': TransactionGasAdjustmentFlag(),
};