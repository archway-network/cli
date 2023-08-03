import sinon, { SinonStub } from 'sinon';
import { ArchwayClient } from '@archwayhq/arch3.js';

import { dummyRewardsQueryResult } from '../dummies';

export default class ArchwayClientStubs {
  public stubbedConnect: SinonStub | undefined;

  connect(): void {
    this.stubbedConnect = sinon
      .stub(ArchwayClient, 'connect')
      .callsFake(
        async () =>
          ({
            getOutstandingRewards: async () => dummyRewardsQueryResult,
          } as any)
      );
  }

  restoreAll(): void {
    this.stubbedConnect?.restore();
  }
}
