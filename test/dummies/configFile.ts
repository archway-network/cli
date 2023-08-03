import { chainRegistryInstance } from '../dummies/chainRegistry';
import { contractsInstance } from '../dummies/contracts';
import { DEFAULT } from '../../src/GlobalConfig';
import { Config } from '../../src/domain';

export const configFile = {
  name: 'foo',
  chainId: 'constantine-3',
  contractsPath: './contracts',
};

export const configString = JSON.stringify(configFile);

export const configInstance = new Config(
  configFile.name,
  configFile.chainId,
  configFile.contractsPath,
  contractsInstance,
  chainRegistryInstance,
  '.',
  DEFAULT.ConfigFileName
);
