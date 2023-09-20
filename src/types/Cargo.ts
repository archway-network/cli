/**
 * Cargo contract metadata information
 */
export interface CargoProjectMetadata {
  name: string;
  version: string;
  label: string;
  wasm: Wasm;
  root: string;
  workspaceRoot: string;
}

/**
 * Wasm information
 */
export interface Wasm {
  fileName: string;
  filePath: string;
  optimizedFilePath: string;
}
