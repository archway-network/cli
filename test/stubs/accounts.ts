import sinon, { SinonStub } from 'sinon';

import keyring from '@archwayhq/keyring-go';

import { KeystoreBackendType } from '../../src/types';
import { aliceStoreEntry, aliceStoredAccount, bobStoreEntry } from '../dummies';

export default class AccountsStubs {
  public stubbedKeyringGet: SinonStub | undefined;
  public stubbedKeyringList: SinonStub | undefined;
  public stubbedKeyringRemove: SinonStub | undefined;
  public stubbedKeyringSet: SinonStub | undefined;

  init(type: KeystoreBackendType = KeystoreBackendType.os, getResponse = aliceStoredAccount, listResponse = [aliceStoreEntry, bobStoreEntry]): void {
    switch (type) {
      case KeystoreBackendType.os:
        this.stubbedKeyringGet = sinon.stub(keyring.OsStore, 'get').callsFake(() => getResponse);
        this.stubbedKeyringList = sinon.stub(keyring.OsStore, 'list').callsFake(() => listResponse);
        this.stubbedKeyringRemove = sinon.stub(keyring.OsStore, 'remove');
        this.stubbedKeyringSet = sinon.stub(keyring.OsStore, 'set');
        break;
      case KeystoreBackendType.file:
        this.stubbedKeyringGet = sinon.stub(keyring.FileStore, 'get').callsFake(() => getResponse);
        this.stubbedKeyringList = sinon.stub(keyring.FileStore, 'list').callsFake(() => listResponse);
        this.stubbedKeyringRemove = sinon.stub(keyring.FileStore, 'remove');
        this.stubbedKeyringSet = sinon.stub(keyring.FileStore, 'set');
        break;
      case KeystoreBackendType.test:
        this.stubbedKeyringGet = sinon.stub(keyring.UnencryptedFileStore, 'get').callsFake(() => getResponse);
        this.stubbedKeyringList = sinon.stub(keyring.UnencryptedFileStore, 'list').callsFake(() => listResponse);
        this.stubbedKeyringRemove = sinon.stub(keyring.UnencryptedFileStore, 'remove');
        this.stubbedKeyringSet = sinon.stub(keyring.UnencryptedFileStore, 'set');
        break;
    }
  }

  restoreAll(): void {
    this.stubbedKeyringGet?.restore();
    this.stubbedKeyringList?.restore();
    this.stubbedKeyringRemove?.restore();
    this.stubbedKeyringSet?.restore();
  }
}
