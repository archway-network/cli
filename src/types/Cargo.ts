/**
 * Cargo contract metadata information
 */
export interface CargoProjectMetadata {
  label: string;
  name: string;
  root: string;
  version: string;
  wasm: Wasm;
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
