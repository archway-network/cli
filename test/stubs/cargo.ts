import sinon, { SinonStub } from 'sinon';

import { Cargo } from '../../src/domain';
import { contractProjectMetadata } from '../dummies';

export default class CargoStubs {
  public stubbedProjectMetadata: SinonStub | undefined;
  public stubbedGenerate: SinonStub | undefined;

  projectMetadata(): void {
    this.stubbedProjectMetadata = sinon.stub(Cargo.prototype, 'projectMetadata').callsFake(async () => contractProjectMetadata);
  }

  generate(): void {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.stubbedGenerate = sinon.stub(Cargo.prototype, 'generate').callsFake(async () => {});
  }

  restoreAll(): void {
    this.stubbedProjectMetadata?.restore();
    this.stubbedGenerate?.restore();
  }
}
