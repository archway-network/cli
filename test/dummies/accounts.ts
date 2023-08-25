import { Coin } from '@cosmjs/proto-signing';

import { ENTRY_SUFFIX, ENTRY_TAG_SEPARATOR } from '../../src/domain';

import { AccountType } from '../../src/types';

export const aliceAccountName = 'Alice';
export const bobAccountName = 'Bob';

export const aliceAddress = 'archway13lq4qvmydry3p394jrrfuv2z5xemzdnsplqdrm';
export const bobAddress = 'archway1dstndnaelj95ksruudc2ww4s9epn8m59xft7jz';

export const aliceMnemonic =
  'fault decrease fit ancient pledge clutch faith urge scan make begin much practice universe ugly base enhance angle fork lyrics stomach code curve all';
export const bobMnemonic =
  'raven eyebrow head chief shoe grass imitate girl cube happy tone dwarf jaguar journey small silver zero mixed hurdle must trap sample obscure movie';

export const aliceEncodedMnemonic =
  '{"type":"directsecp256k1hdwallet-v1","kdf":{"algorithm":"argon2id","params":{"outputLength":32,"opsLimit":24,"memLimitKib":12288}},"encryption":{"algorithm":"xchacha20poly1305-ietf"},"data":"s2djbGL0yqGBt05QoVRb2lHxJcABnIQowMF94HujK3U0GQiu/G0Dfm4qPGi8Wp+b5TkCvJIHkaWDeFNDLsnRw9++tvkFV4LafwL3Kxp7C6ihxTQfO0vVwvofQxZDTDspxCVX5hSkUzrxey+xeeuU8KbxPB/jbetG0kCOHr9SjRlSXfMmX9Tr2/K7Xi2ZBgxJxYxFryItvyPRWYOlAUEYN8L8FLeV/2RdXNidgDjps+uOypHsh5W1ZPGmh27tonuMG2OX7Com9wOXsKgtk9FoHqDA0B49OMMjCeNAGe1j4pUhIHw6P1ig0szFrw5POb5RtqnwcevJoHgym1UiJbkf93QUEc/5cVI7+yXU"}';
export const bobEncodedMnemonic =
  '{"type":"directsecp256k1hdwallet-v1","kdf":{"algorithm":"argon2id","params":{"outputLength":32,"opsLimit":24,"memLimitKib":12288}},"encryption":{"algorithm":"xchacha20poly1305-ietf"},"data":"jhxF+tuyTuOVMTuR65fftyTonbzbbitysukRM5Qli2ehFGm7gKsjPDzWB7249na93/tFXmD5utaUlfQ6hP6IgAph9YadXbIyH6u10WiGqxP9zMDPVxUPElJ6rQt+f8WjgADAoBhxgzLcjCCMNQK1yoEwiWW3xSAi58QFD492Xh9i7FUPG7DzeSWEwog6ROwmpbW2LixEmLD8EW/T8QgIEXTUs34sI9l0zyO4sYtPN/01V1gcl2BQOS+zFC1OwAIfvSDelkWOfyeKYNaESof5Hw4jWjVzzsGsySVWvABj3qeuPqLLLywkEhjfCRGaSZAd/+6VEqhnsKNXl6j4ItzeOuBC5MpTC2SKcw=="}';

export const alicePublicKey = {
  '@type': 'secp256k1',
  key: 'AhVdMs9/rOISUT9vCep8T0Se/JED1Lwy/XADdoKvN253',
};
export const bobPublicKey = {
  '@type': 'secp256k1',
  key: 'Az2CRFc4sD2ITRx9T86SmzcHHvd6u32gV795sUUvYk4q',
};

export const aliceAccountType = AccountType.LOCAL;
export const bobAccountType = AccountType.LOCAL;

export const aliceAccountBase = {
  name: aliceAccountName,
  address: aliceAddress,
  type: aliceAccountType,
};
export const bobAccountBase = {
  name: bobAccountName,
  address: bobAddress,
  type: bobAccountType,
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
  mnemonic: aliceEncodedMnemonic,
};
export const bobAccountWithMnemonic = {
  ...bobAccountInstance,
  mnemonic: bobEncodedMnemonic,
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
