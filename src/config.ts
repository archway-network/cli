/**
 * Default values accross the project
 */
export const DEFAULT = {
  ChainId: 'constantine-3',
  ConfigFileName: 'modulor.json',
  ContractsRelativePath: './contracts',
  ContractsCargoWorkspace: 'contracts/*',
  ChainsRelativePath: './.modulor/chains',
  DeploymentsRelativePath: './.modulor/deployments',
  ChainFileExtension: '.json',
  DeploymentFileExtension: '.json',
  Template: 'default',
  WorkspaceTemplate: 'base-workspace',
  // TO DO change back once templates are merged to main
  TemplateBranch: 'feature/workspace-template',
  GasPriceAmount: '0.005',
  GasPriceDenom: 'uarch',
  InstantiateSchemaRelativePath: './schema/instantiate_msg.json',
};

/**
 * Prefixes and suffixes to be used in commands as a standardized part of the messages displayed
 */
export const MESSAGES = {
  SuccessPrefix: '✅',
  ErrorPrefix: '❌',
  WarningPrefix: '⚠️',
};

/**
 * URLs of relevant git repositories
 */
export const REPOSITORIES = {
  Templates: 'https://github.com/archway-network/archway-templates',
};

/**
 * Account and keys config
 */
export const ACCOUNTS = {
  SecretServiceName: 'archway.modulor',
  KeyFilesPath: `${process.env.HOME}/.archway`,
  EntrySeparator: '<-<>->',
  EntrySuffix: 'account',
  TestEntrySuffix: 'test',
  AddressBech32Prefix: 'archway',
};
