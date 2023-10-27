import sinon, { SinonStub } from 'sinon';

import { Deployments } from '../../src/domain';
import { deploymentsEmptyInstance, deploymentsInstance } from '../dummies';

export default class DeploymentsStubs {
  public stubbedInit: SinonStub | undefined;
  public stubbetInitZeroDeployments: SinonStub | undefined;

  init(): void {
    this.stubbedInit = sinon.stub(Deployments, 'init').callsFake(async () => deploymentsInstance);
  }

  initZeroDeployments(): void {
    this.stubbetInitZeroDeployments = sinon.stub(Deployments, 'init').callsFake(async () => deploymentsEmptyInstance);
  }

  restoreAll(): void {
    this.stubbedInit?.restore();
    this.stubbetInitZeroDeployments?.restore();
  }
}
