import sinon, { SinonStub } from 'sinon';

import { ChainRegistry } from '../../src/domain';
import { chainRegistryInstance } from '../dummies';

export default class ChainRegistryStubs {
  public stubbedInit: SinonStub | undefined;

  init(): void {
    this.stubbedInit = sinon
      .stub(ChainRegistry, 'init')
      .callsFake(async () => chainRegistryInstance);
  }

  restoreAll(): void {
    this.stubbedInit?.restore();
  }
}
