/**
 * Default values accross the project
 */
export const DEFAULT = {
  ChainId: 'constantine-1',
  ConfigFileName: 'modulor.json',
  ContractsRelativePath: './contracts',
  ChainsRelativePath: './.modulor/chains',
  DeploymentsRelativePath: './.modulor/deployments',
  ChainFileExtension: '.json',
  DeploymentFileExtension: '.json',
};

/**
 * Prefixes and suffixes to be used in commands as a standardized part of the messages displayed
 */
export const MESSAGES = {
  SuccessPrefix: '✅ ',
  ErrorPrefix: '❌ ',
  WarningPrefix: '⚠️ '
}
