import path from 'node:path';

import { DEFAULT_DEPLOYMENTS_RELATIVE_PATH, DEPLOYMENTS_FILE_EXTENSION, Deployments, DeploymentsByChain } from '../../src/domain';
import { chainNames } from './chainRegistry';

import { DeploymentAction } from '../../src/types';

export const storeDeployment = {
  action: 'store' as DeploymentAction,
  txhash: '76B73AC422665CBAD3F796B78ED952E392538F668798377470D95999F2A74724',
  wasm: {
    codeId: 207,
    checksum: '144f0ee54b2b107b0b4895164d21e9127b86bde67c894e6a7f52f146f166b930',
  },
  contract: {
    name: 'my-contract',
    version: '0.1.0',
  },
};

export const instantiateDeployment = {
  action: 'instantiate' as DeploymentAction,
  txhash: 'A1F9F208C12B939E8F34FA8FE950EAD07E16FB6AFCBEE638384C60846339D86C',
  wasm: {
    codeId: 207,
  },
  contract: {
    name: 'my-contract',
    version: '0.1.0',
    address: 'archway17kan46qvsvz0j4jyy52scywwcer5vr5mwyd653jfvvqgxs9ghets9nekqh',
    admin: 'archway1ef8r7lwu6xtxkzhkmeufpcv7m3xy4gm5l2mazd',
  },
  msg: {
    count: 0,
  },
};

export const metadataDeployment = {
  action: 'metadata' as DeploymentAction,
  txhash: 'EEA49C46AAECBF8B8F0F8A67F601A1265A40A5778B19867C75AD6087A84D8A2E',
  wasm: {
    codeId: 207,
  },
  contract: {
    name: 'my-contract',
    version: '0.1.0',
    address: 'archway17kan46qvsvz0j4jyy52scywwcer5vr5mwyd653jfvvqgxs9ghets9nekqh',
    admin: 'archway1ef8r7lwu6xtxkzhkmeufpcv7m3xy4gm5l2mazd',
  },
  metadata: {
    contractAddress: 'archway1ef8r7lwu6xtxkzhkmeufpcv7m3xy4gm5l2mazd',
    ownerAddress: 'archway1ef8r7lwu6xtxkzhkmeufpcv7m3xy4gm5l2mazd',
    rewardsAddress: 'archway1ef8r7lwu6xtxkzhkmeufpcv7m3xy4gm5l2mazd',
  },
};

export const premiumDeployment = {
  action: 'premium' as DeploymentAction,
  txhash: 'EEA49C46AAECBF8B8F0F8A67F601A1265A40A5778B19867C75AD6087A84D8A2E',
  wasm: {
    codeId: 207,
  },
  contract: {
    name: 'my-contract',
    version: '0.1.0',
    address: 'archway17kan46qvsvz0j4jyy52scywwcer5vr5mwyd653jfvvqgxs9ghets9nekqh',
    admin: 'archway1ef8r7lwu6xtxkzhkmeufpcv7m3xy4gm5l2mazd',
  },
  flatFee: {
    denom: 'aarch',
    amount: '1000',
  },
};

export const deploymentFile = {
  deployments: [metadataDeployment, instantiateDeployment, storeDeployment],
};

export const deploymentString = JSON.stringify(deploymentFile);

export const deploymentsInstance = new Deployments(
  [
    DeploymentsByChain.make(
      DEFAULT_DEPLOYMENTS_RELATIVE_PATH,
      path.basename(chainNames[0], DEPLOYMENTS_FILE_EXTENSION),
      deploymentFile.deployments
    ),
  ],
  DEFAULT_DEPLOYMENTS_RELATIVE_PATH
);

export const deploymentsEmptyInstance = new Deployments(
  [DeploymentsByChain.make(DEFAULT_DEPLOYMENTS_RELATIVE_PATH, path.basename(chainNames[0], DEPLOYMENTS_FILE_EXTENSION), [])],
  DEFAULT_DEPLOYMENTS_RELATIVE_PATH
);
