import { Config } from '../../src/domain';
import { chainRegistryInstance } from '../dummies/chainRegistry';
import { contractsInstance } from '../dummies/contracts';

import { jsonStringify } from '../../src/lib/json';
import { ConfigData, KeystoreBackendType } from '../../src/types';

export const configFile: ConfigData = {
  'chain-id': 'constantine-3',
  'contracts-path': './contracts',
  'keyring-backend': KeystoreBackendType.test,
};

export const configString = jsonStringify(configFile);

export const configInstance = new Config('.', contractsInstance, chainRegistryInstance, configFile, configFile);
