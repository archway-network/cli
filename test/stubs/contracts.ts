import sinon, { SinonStub } from 'sinon';

import { Contracts } from '../../src/domain';
import { contractsInstance } from '../dummies';

import { InstantiateDeployment, StoreDeployment } from '../../src/types';

export default class ContractsStubs {
  public stubbedInit: SinonStub | undefined;
  public stubbedFindInstantiateDeployment: SinonStub | undefined;
  public stubbedFindStoreDeployment: SinonStub | undefined;

  init(): void {
    this.stubbedInit = sinon.stub(Contracts, 'init').callsFake(async () => contractsInstance);
  }

  findInstantiateDeployment(deployment: InstantiateDeployment): void {
    this.stubbedFindInstantiateDeployment = sinon.stub(Contracts.prototype, 'findInstantiateDeployment').callsFake(() => deployment);
  }

  findStoreDeployment(deployment: StoreDeployment): void {
    this.stubbedFindStoreDeployment = sinon.stub(Contracts.prototype, 'findStoreDeployment').callsFake(() => deployment);
  }

  restoreAll(): void {
    this.stubbedInit?.restore();
    this.stubbedFindInstantiateDeployment?.restore();
    this.stubbedFindStoreDeployment?.restore();
  }
}
