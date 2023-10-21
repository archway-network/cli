import { toBase64 } from '@cosmjs/encoding';
import { LedgerSigner } from '@cosmjs/ledger-amino';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';

import { Account, AccountType, ExtendedHdPath } from '@/types';

const OPEN_TIMEOUT = 5000; // 5 seconds
const LISTEN_TIMEOUT = 60_000; // 60 seconds

/**
 * Manages communication with a Ledger device
 */
export namespace Ledger {
  /**
   * Connect to a ledger device and get a {@link LedgerSigner} instance
   *
   * @param prefix - Optional - Bech 32 prefix for the addresses, defaults to 'archway'
   * @returns Instance of {@link LedgerSigner}
   */
  export async function getLedgerSigner(hdPath: ExtendedHdPath, prefix: string): Promise<LedgerSigner> {
    const transport = await TransportNodeHid.create(OPEN_TIMEOUT, LISTEN_TIMEOUT);
    return new LedgerSigner(transport, { hdPaths: [hdPath.value], prefix });
  }

  /**
   * Get an account's info from the ledger device
   *
   * @param name - Name of the account
   * @param prefix - Optional - Bech 32 prefix for the address, defaults to 'archway'
   * @returns Instance of {@link Account}
   */
  export async function getAccount(name: string, hdPath: ExtendedHdPath, prefix: string): Promise<Account> {
    const signer = await getLedgerSigner(hdPath, prefix);
    const { address, algo, pubkey } = (await signer.getAccounts())[0];

    return {
      type: AccountType.LEDGER,
      name,
      address,
      hdPath: hdPath.toString(),
      publicKey: {
        algo,
        key: toBase64(pubkey),
      },
    };
  }
}
