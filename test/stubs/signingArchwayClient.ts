import sinon, { SinonStub } from 'sinon';
import { SigningArchwayClient } from '@archwayhq/arch3.js';

import {
  dummyExecuteTransaction,
  dummyInstantiateTransaction,
  dummyMetadataTransaction,
  dummyMigrateTransaction,
  dummyPremiumTransaction,
  dummyQueryResult,
  dummyRewardsWithdrawResult,
  dummyStoreTransaction,
} from '../dummies';

export default class SigningArchwayClientStubs {
  public stubbedConnectWithSigner: SinonStub | undefined;

  connectWithSigner(): void {
    this.stubbedConnectWithSigner = sinon.stub(SigningArchwayClient, 'connectWithSigner').callsFake(
      async () =>
        ({
          sendTokens: async () => true,
          withdrawContractRewards: async () => dummyRewardsWithdrawResult,
          queryContractSmart: async () => dummyQueryResult,
          execute: async () => dummyExecuteTransaction,
          instantiate: async () => dummyInstantiateTransaction,
          setContractMetadata: async () => dummyMetadataTransaction,
          migrate: async () => dummyMigrateTransaction,
          setContractPremium: async () => dummyPremiumTransaction,
          upload: async () => dummyStoreTransaction,
        } as any)
    );
  }

  restoreAll(): void {
    this.stubbedConnectWithSigner?.restore();
  }
}
