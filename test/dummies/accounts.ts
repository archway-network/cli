import { Coin } from '@cosmjs/proto-signing';

import { ENTRY_SUFFIX, ENTRY_TAG_SEPARATOR } from '../../src/domain';

import { AccountType } from '../../src/types';

export const aliceAccountName = 'Alice';
export const bobAccountName = 'Bob';

export const aliceAddress = 'archway1yzm6t20qdjyz0a7wuqc7z83rneq3a382a2zy7c';
export const bobAddress = 'archway1yzm6t20qdjyz0a7wuqc7z83rneq3a382a2zy7c';

export const aliceMnemonic =
  'cattle thrive tonight battle polar drop corn army man depart crazy choose apology oil level violin bullet this adapt aisle faith reunion key fragile';
export const bobMnemonic =
  'hood asset around urban proof fancy broom sustain typical cushion enjoy dynamic police grant airport kit output area custom energy toe siren swamp priority';

export const alicePublicKey = {
  '@type': 'secp256k1',
  key: 'A9Ds3YVYqgefmr5XaDnh74Ur+xX+VeKTyk9pExHFjBsn',
};
export const bobPublicKey = {
  '@type': 'secp256k1',
  key: 'AlOxi1K6OPtTlqroA9aJcKWfI3u2YCduektBXnRk963b',
};

export const aliceAccountType = AccountType.LOCAL
export const bobAccountType = AccountType.LOCAL

export const aliceAccountBase = {
  name: aliceAccountName,
  address: aliceAddress,
  type: aliceAccountType
};
export const bobAccountBase = {
  name: bobAccountName,
  address: bobAddress,
  type: bobAccountType
};

export const aliceAccountInstance = {
  ...aliceAccountBase,
  publicKey: alicePublicKey,
};
export const bobAccountInstance = {
  ...bobAccountBase,
  publicKey: bobPublicKey,
};

export const aliceAccountWithMnemonic = {
  ...aliceAccountInstance,
  mnemonic: aliceMnemonic,
};
export const bobAccountWithMnemonic = {
  ...bobAccountInstance,
  mnemonic: bobMnemonic,
};

export const aliceStoredAccount = JSON.stringify(aliceAccountWithMnemonic);
export const bobStoredAccount = JSON.stringify(bobAccountWithMnemonic);

export const aliceStoreEntry = `${aliceAccountName}${ENTRY_TAG_SEPARATOR}${aliceAccountType}${ENTRY_TAG_SEPARATOR}${aliceAddress}.${ENTRY_SUFFIX}`;
export const bobStoreEntry = `${bobAccountName}${ENTRY_TAG_SEPARATOR}${bobAccountType}${ENTRY_TAG_SEPARATOR}${bobAddress}.${ENTRY_SUFFIX}`;

export const dummyAmount: Coin = {
  amount: '10',
  denom: 'aarch',
};
export const dummyAmountString = `${dummyAmount.amount}${dummyAmount.denom}`;
