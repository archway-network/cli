import sinon, { SinonStub } from 'sinon';
import { DockerOptimizer, OptimizerError } from '../../src/domain';

export default class OptimizerStubs {
  public stubbedOptimizerSuccess: SinonStub | undefined;
  public stubbedOptimizerFail: SinonStub | undefined;

  optimizerSuccess(): void {
    this.stubbedOptimizerSuccess = sinon.stub(DockerOptimizer.prototype, 'run').callsFake(async () => { });
  }

  optimizerFail(errorMessage: string): void {
    this.stubbedOptimizerFail = sinon
      .stub(DockerOptimizer.prototype, 'run')
      .callsFake(async () => { throw new OptimizerError(errorMessage, 1) });
  }

  restoreAll(): void {
    this.stubbedOptimizerSuccess?.restore();
    this.stubbedOptimizerFail?.restore();
  }
}
