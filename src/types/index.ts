export * from './Account';
export * from './Cargo';
export * from './Chain';
export * from './Coin';
export * from './ConfigData';
export * from './ConsoleError';
export * from './Contract';
export * from './ContractTemplate';
export * from './Deployment';

/**
 * Possible merge modes on object update
 */
export enum MergeMode {
  OVERWRITE = 'OVERWRITE',
  APPEND = 'APPEND',
  PREPEND = 'PREPEND',
}
