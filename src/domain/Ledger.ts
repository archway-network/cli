/* eslint-disable unicorn/no-static-only-class */
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import { LedgerSigner } from '@cosmjs/ledger-amino';
import { HdPath, Slip10RawIndex } from '@cosmjs/crypto';
import { toBase64 } from '@cosmjs/encoding';

import { DEFAULT_ADDRESS_BECH_32_PREFIX } from './Accounts';

import { Account, AccountType } from '@/types';

const LISTEN_TIMEOUT = 120_000;
const OPEN_TIMEOUT = 120_000;

/**
 * Creates a BIP44 compatible derivation path
 *
 * @param coinType - Optional - Defaults to 118 which is the standard cosmos coinType
 * @param account - Optional - Defaults to 0
 * @param change  - Optional - Defaults to 0
 * @param index  - Optional - Defaults to 0
 * @returns Array containing the derivation path values
 */
export function makeCosmosDerivationPath(coinType = 118, account = 0, change = 0, index = 0): HdPath {
  return [
    Slip10RawIndex.hardened(44),
    Slip10RawIndex.hardened(coinType),
    Slip10RawIndex.hardened(account),
    Slip10RawIndex.normal(change),
    Slip10RawIndex.normal(index),
  ];
}

/**
 * Manages communication with a Ledger device
 */
export class Ledger {
  /**
   * Connect to a ledger device and get a {@link LedgerSigner} instance
   *
   * @param prefix - Optional - Bech 32 prefix for the addresses, defaults to 'archway'
   * @returns Instance of {@link LedgerSigner}
   */
  static async getLedgerSigner(prefix = DEFAULT_ADDRESS_BECH_32_PREFIX): Promise<LedgerSigner> {
    const ledgerTransport = await TransportNodeHid.create(OPEN_TIMEOUT, LISTEN_TIMEOUT);
    return new LedgerSigner(ledgerTransport, { hdPaths: [makeCosmosDerivationPath()], prefix });
  }

  /**
   * Get an account's info from the ledger device
   *
   * @param name - Name of the account
   * @param prefix - Optional - Bech 32 prefix for the address, defaults to 'archway'
   * @returns Instance of {@link Account}
   */
  static async getAccount(name: string, prefix = DEFAULT_ADDRESS_BECH_32_PREFIX): Promise<Account> {
    const signer = await this.getLedgerSigner(prefix);

    const account = (await signer.getAccounts())[0];

    return {
      name,
      address: account.address,
      publicKey: {
        '@type': account.algo,
        key: toBase64(account.pubkey),
      },
      type: AccountType.LEDGER,
    };
  }
}
