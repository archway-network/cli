import { Flags } from '@oclif/core';
import { AlphabetLowercase } from '@oclif/core/lib/interfaces';
import { CustomOptions, DefaultContext } from '@oclif/core/lib/interfaces/parser';

import { showPrompt } from '@/ui';
import { FromAccountPrompt } from '@/services';
import { parseAmount } from '@/utils';

import { Amount } from '@/types';

const FromDescription = 'Signer of the tx';
const FeeDescription = 'Extra fees to pay along with the transaction';
const FeeAccountDescription = 'Account used to pays fees for the transaction instead of the signer';
const ConfirmDescription = 'Asks for confirmation before broadcasting the tx or skips the prompt completely';

/**
 * Util function to prompt the user for a chain id if it is not provided
 *
 * @param _input - Oclif context, not used
 * @param isWritingManifest - Optional - Sometimes Oclif tries to cache the default, to avoid it from triggering multiple prompts, we verify that this variable is undefined
 * @returns Promise containing the chain id value if prompted
 */
const getFromAccount = async (_input: DefaultContext<CustomOptions>, isWritingManifest?: boolean): Promise<string | undefined> => {
  if (isWritingManifest === undefined) {
    const response = await showPrompt(FromAccountPrompt);
    return response.from as string;
  }
};

/**
 * Definition of Transaction From flag
 */
export const definitionTransactionFrom = {
  description: FromDescription,
  char: 'f' as AlphabetLowercase,
  default: getFromAccount,
};

/**
 * Transaction From flag
 */
export const transactionFrom = Flags.string(definitionTransactionFrom);

/**
 * Definition of Transaction Fee flag
 */
export const definitionTransactionFee = {
  description: FeeDescription,
  parse: async (val: string): Promise<Amount> => parseAmount(val),
};

/**
 * Transaction Fee flag
 */
export const transactionFee = Flags.custom<Amount>(definitionTransactionFee);

/**
 * Definition of Transaction Fee Account flag
 */
export const definitionTransactionFeeAccount = {
  description: FeeAccountDescription,
};

/**
 * Transaction Fee Account flag
 */
export const transactionFeeAccount = Flags.string(definitionTransactionFeeAccount);

/**
 * Definition of Transaction Confirm flag
 */
export const definitionTransactionConfirm = {
  default: true,
  description: ConfirmDescription,
  allowNo: true,
};

/**
 * Transaction Confirm flag
 */
export const transactionConfirm = Flags.boolean(definitionTransactionConfirm);

/**
 * All of the Transaction related flags
 */
export const TransactionFlags = {
  from: transactionFrom,
  fee: transactionFee(),
  'fee-account': transactionFeeAccount,
  confirm: transactionConfirm,
};
