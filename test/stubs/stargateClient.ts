import sinon, { SinonStub } from 'sinon';
import { StargateClient } from '@cosmjs/stargate';

import { dummyAmount } from '../dummies';

export default class StargateClientStubs {
  public stubbedConnect: SinonStub | undefined;

  connect(): void {
    this.stubbedConnect = sinon
      .stub(StargateClient, 'connect')
      .callsFake(async () => ({ getAllBalances: async () => [dummyAmount] } as any));
  }

  restoreAll(): void {
    this.stubbedConnect?.restore();
  }
}
