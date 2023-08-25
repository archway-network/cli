import { Flags } from '@oclif/core';
import { AlphabetLowercase } from '@oclif/core/lib/interfaces';
import { CustomOptions, DefaultContext } from '@oclif/core/lib/interfaces/parser';

import { Prompts } from '@/services';
import { parseAmount } from '@/utils';

import { Amount } from '@/types';

const FromDescription = 'Signer of the tx';
const FeeDescription = 'Extra fees to pay along with the transaction';
const FeeAccountDescription = 'Account used to pays fees for the transaction instead of the signer';
const ConfirmDescription = 'Asks for confirmation before broadcasting the tx or skips the prompt completely';
const GasAdjustmentDescription = 'Asks for confirmation before broadcasting the tx or skips the prompt completely';

/**
 * Util function to prompt the user for a chain id if it is not provided
 *
 * @param _input - Oclif context, not used
 * @param isWritingManifest - Optional - Sometimes Oclif tries to cache the default, to avoid it from triggering multiple prompts, we verify that this variable is undefined
 * @returns Promise containing the chain id value if prompted
 */
const inputFromAccount = async (_input: DefaultContext<CustomOptions>, isWritingManifest?: boolean): Promise<string | undefined> => {
  if (isWritingManifest === undefined) {
    const promptedFromAccount = await Prompts.fromAccount();
    return promptedFromAccount?.from as string;
  }
};

/**
 * Definition of Transaction From flag
 */
export const ParamsTransactionFromFlag = {
  description: FromDescription,
  char: 'f' as AlphabetLowercase,
  default: inputFromAccount,
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
  'fee-account': TransactionFeeAccountFlag,
  confirm: TransactionConfirmFlag,
  // eslint-disable-next-line new-cap
  'gas-adjustment': TransactionGasAdjustmentFlag(),
};
