import sinon, { SinonStub } from 'sinon';
import keyring from '@archwayhq/keyring-go';

import { aliceStoreEntry, aliceStoredAccount, bobStoreEntry } from '../dummies';

import { BackendType } from '../../src/types';

export default class AccountsStubs {
  public stubbedKeyringGet: SinonStub | undefined;
  public stubbedKeyringList: SinonStub | undefined;
  public stubbedKeyringRemove: SinonStub | undefined;
  public stubbedKeyringSet: SinonStub | undefined;

  init(type: BackendType = BackendType.os, getResponse = aliceStoredAccount, listResponse = [aliceStoreEntry, bobStoreEntry]): void {
    switch (type) {
      case BackendType.os:
        this.stubbedKeyringGet = sinon.stub(keyring.OsStore, 'get').callsFake(() => getResponse);
        this.stubbedKeyringList = sinon.stub(keyring.OsStore, 'list').callsFake(() => listResponse);
        this.stubbedKeyringRemove = sinon.stub(keyring.OsStore, 'remove');
        this.stubbedKeyringSet = sinon.stub(keyring.OsStore, 'set');
        break;
      case BackendType.file:
        this.stubbedKeyringGet = sinon.stub(keyring.FileStore, 'get').callsFake(() => getResponse);
        this.stubbedKeyringList = sinon.stub(keyring.FileStore, 'list').callsFake(() => listResponse);
        this.stubbedKeyringRemove = sinon.stub(keyring.FileStore, 'remove');
        this.stubbedKeyringSet = sinon.stub(keyring.FileStore, 'set');
        break;
      case BackendType.test:
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
