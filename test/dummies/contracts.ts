import { Contracts, DEFAULT_CONTRACTS_RELATIVE_PATH } from '../../src/domain';
import { deploymentFile, deploymentsInstance } from './deployments';

import { CargoProjectMetadata, Contract } from '../../src/types';

export const contractProjectMetadata: CargoProjectMetadata = {
  name: 'my-contract',
  version: '0.1.0',
  label: 'my-contract-0.1.0',
  wasm: {
    fileName: 'my-contract.wasm',
    filePath: './target/wasm32-unknown-unknown/release/my-contract.wasm',
    optimizedFilePath: './artifacts/my-contract.wasm',
  },
  root: './contracts/my-contract',
  workspaceRoot: '.',
};

export const contractData: Contract = {
  deployments: deploymentFile.deployments.map(item => ({ ...item, chainId: 'constantine-3' })),
  ...contractProjectMetadata,
};

export const contractsInstance = new Contracts([contractData], '.', DEFAULT_CONTRACTS_RELATIVE_PATH, deploymentsInstance);

export const contractArgument = '{"count": 1}';

export const contractArgumentSchema =
  '{"$schema": "http://json-schema.org/draft-07/schema#","title": "QueryMsg","oneOf": [{"type": "object","required": ["count"],"properties": {"count": {"type": "number"}},"additionalProperties": false}]}';
