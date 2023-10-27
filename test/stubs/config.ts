import sinon, { SinonStub } from 'sinon';

import { Config } from '../../src/domain';
import { configInstance } from '../dummies';

export default class ConfigStubs {
  public stubbedInit: SinonStub | undefined;
  public stubbedMake: SinonStub | undefined;
  public stubbedExists: SinonStub | undefined;
  public stubbedNonExists: SinonStub | undefined;
  public stubbedAssertIsValidWorkspace: SinonStub | undefined;

  init(): void {
    this.stubbedInit = sinon.stub(Config, 'init').callsFake(async () => configInstance);
  }

  make(): void {
    this.stubbedMake = sinon.stub(Config, 'make').callsFake(async () => configInstance);
  }

  exists(): void {
    this.stubbedExists = sinon.stub(Config, 'exists').callsFake(async () => true);
  }

  nonExists(): void {
    this.stubbedNonExists = sinon.stub(Config, 'exists').callsFake(async () => false);
  }

  assertIsValidWorkspace(): void {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.stubbedAssertIsValidWorkspace = sinon.stub(Config.prototype, 'assertIsValidWorkspace').callsFake(async () => {});
  }

  restoreAll(): void {
    this.stubbedInit?.restore();
    this.stubbedMake?.restore();
    this.stubbedExists?.restore();
    this.stubbedNonExists?.restore();
    this.stubbedAssertIsValidWorkspace?.restore();
  }
}
