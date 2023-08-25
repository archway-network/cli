import sinon, { SinonStub } from 'sinon';
import { ArchwayClient } from '@archwayhq/arch3.js';

import { dummyQueryResult, dummyRewardsQueryResult } from '../dummies';

export default class ArchwayClientStubs {
  public stubbedConnect: SinonStub | undefined;

  connect(): void {
    this.stubbedConnect = sinon
      .stub(ArchwayClient, 'connect')
      .callsFake(
        async () =>
          ({
            getOutstandingRewards: async () => dummyRewardsQueryResult,
            queryContractSmart: async () => dummyQueryResult,
          } as any)
      );
  }

  restoreAll(): void {
    this.stubbedConnect?.restore();
  }
}
