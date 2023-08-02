import { Flags } from '@oclif/core';
import { CustomOptions, DefaultContext } from '@oclif/core/lib/interfaces/parser';

import { showPrompt } from '@/ui/Prompt';
import { FromAccountPrompt } from '@/services/Prompts';
import { parseAmount } from '@/utils/coin';
import { Amount } from '@/types/Coin';

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
 * Transaction From flag
 */
export const transactionFrom = Flags.string({
  description: FromDescription,
  char: 'f',
  default: getFromAccount,
});

/**
 * Trnsaction Fee flag
 */
export const transactionFee = Flags.custom<Amount>({
  description: FeeDescription,
  parse: async (val: string) => parseAmount(val),
});

/**
 * Transaction Fee Account flag
 */
export const transactionFeeAccount = Flags.string({
  description: FeeAccountDescription,
});

/**
 * Transaction Confirm flag
 */
export const transactionConfirm = Flags.boolean({
  default: true,
  description: ConfirmDescription,
  allowNo: true,
});

/**
 * All of the Transaction related flags
 */
export const TransactionFlags = {
  from: transactionFrom,
  fee: transactionFee(),
  'fee-account': transactionFeeAccount,
  confirm: transactionConfirm,
};
