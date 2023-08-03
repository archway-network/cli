import sinon, { SinonStub } from 'sinon';
import { DockerOptimizer } from '../../src/domain';

export default class OptimizerStubs {
  public stubbedOptimizerSuccess: SinonStub | undefined;
  public stubbedOptimizerFail: SinonStub | undefined;

  optimizerSuccess(): void {
    this.stubbedOptimizerSuccess = sinon.stub(DockerOptimizer.prototype, 'run').callsFake(async () => ({ statusCode: 0 }));
  }

  optimizerFail(errorMessage: string): void {
    this.stubbedOptimizerFail = sinon
      .stub(DockerOptimizer.prototype, 'run')
      .callsFake(async () => ({ error: errorMessage, statusCode: 1 }));
  }

  restoreAll(): void {
    this.stubbedOptimizerSuccess?.restore();
    this.stubbedOptimizerFail?.restore();
  }
}
