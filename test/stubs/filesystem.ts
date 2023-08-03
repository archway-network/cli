import sinon, { SinonStub } from 'sinon';
import fs from 'node:fs/promises';

export default class FilesystemStubs {
  public stubbedAccess: SinonStub | undefined;
  public stubbedAccessFail: SinonStub | undefined;
  public stubbedWriteFile: SinonStub | undefined;
  public stubbedReadFile: SinonStub | undefined;
  public stubbedReaddir: SinonStub | undefined;
  public stubbedMkdir: SinonStub | undefined;

  access(): void {
    this.stubbedAccess = sinon.stub(fs, 'access');
  }

  accessFail(): void {
    this.stubbedAccessFail = sinon.stub(fs, 'access').rejects();
  }

  writeFile(): void {
    this.stubbedWriteFile = sinon.stub(fs, 'writeFile');
  }

  readFile(value: any = '{}'): void {
    this.stubbedReadFile = sinon.stub(fs, 'readFile').callsFake(async () => value);
  }

  readdir(value: any = []): void {
    this.stubbedReaddir = sinon.stub(fs, 'readdir').callsFake(async () => value);
  }

  mkdir(): void {
    this.stubbedMkdir = sinon.stub(fs, 'mkdir');
  }

  restoreAll(): void {
    this.stubbedAccess?.restore();
    this.stubbedAccessFail?.restore();
    this.stubbedWriteFile?.restore();
    this.stubbedReadFile?.restore();
    this.stubbedReaddir?.restore();
    this.stubbedMkdir?.restore();
  }
}
