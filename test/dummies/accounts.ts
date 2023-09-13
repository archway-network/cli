import * as bip39 from 'bip39';
import elliptic from 'elliptic';

import { rawSecp256k1PubkeyToRawAddress } from '@cosmjs/amino';
import { Secp256k1, Slip10, Slip10Curve } from '@cosmjs/crypto';
import { toBase64, toBech32 } from '@cosmjs/encoding';
import { Coin } from '@cosmjs/proto-signing';

import { DEFAULT_ADDRESS_BECH_32_PREFIX } from '../../src/domain';
import { toEntryTag } from '../../src/domain/keystore';
import { AccountType, ExtendedHdPath, LocalAccount } from '../../src/types';

// eslint-disable-next-line new-cap
const secp256k1 = new elliptic.ec('secp256k1');

function createTestAccount(name: string): LocalAccount & { mnemonic: string; } {
  const mnemonic = bip39.generateMnemonic();
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, ExtendedHdPath.Default.value);
  const keyPair = secp256k1.keyFromPrivate(privkey);
  const pubkey = Secp256k1.compressPubkey(Uint8Array.from(keyPair.getPublic('array')));
  const address = toBech32(DEFAULT_ADDRESS_BECH_32_PREFIX, rawSecp256k1PubkeyToRawAddress(pubkey))

  return {
    type: AccountType.LOCAL,
    name,
    address,
    publicKey: {
      algo: 'secp256k1',
      key: toBase64(pubkey),
    },
    privateKey: toBase64(privkey),
    mnemonic
  };
}

export const aliceAccountName = 'Alice';
export const aliceAccountInstance = createTestAccount(aliceAccountName);
export const {
  type: aliceAccountType,
  address: aliceAddress,
  publicKey: alicePublicKey,
  mnemonic: aliceMnemonic,
} = aliceAccountInstance;

export const aliceStoreEntry = toEntryTag(aliceAccountInstance);
export const aliceStoredAccount = JSON.stringify(aliceAccountInstance);

export const bobAccountName = 'Bob';
export const bobAccountInstance = createTestAccount(bobAccountName);
export const {
  type: bobAccountType,
  address: bobAddress,
  publicKey: bobPublicKey,
  mnemonic: bobMnemonic,
} = bobAccountInstance;

export const bobStoreEntry = toEntryTag(bobAccountInstance);
export const bobStoredAccount = JSON.stringify(bobAccountInstance);

export const dummyAmount: Coin = {
  amount: '10',
  denom: 'aarch',
};
export const dummyAmountString = `${dummyAmount.amount}${dummyAmount.denom}`;
