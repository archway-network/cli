import { CargoProjectMetadata } from '../../src/types/Cargo';

export const contractProjectMetadata: CargoProjectMetadata = {
  name: 'test',
  version: '0.1.0',
  label: 'test-0.1.0',
  wasm: {
    fileName: 'test.wasm',
    filePath: '/Users/eliasmpw/Projects/Archway/archway-cli-v2/target/wasm32-unknown-unknown/release/yyy.wasm',
    optimizedFilePath: '/Users/eliasmpw/Projects/Archway/archway-cli-v2/artifacts/yyy.wasm',
  },
  root: '/Users/eliasmpw/Projects/Archway/archway-cli-v2/contracts/test',
  workspaceRoot: '/Users/eliasmpw/Projects/Archway/archway-cli-v2',
};
