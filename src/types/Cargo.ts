/* eslint-disable camelcase */

/**
 * Cargo metadata information
 */
export interface Metadata {
  packages: Package[];
  workspace_members: string[];
  resolve: any;
  target_directory: string;
  version: number;
  workspace_root: string;
  metadata: any;
}

/**
 * Cargo package information
 */
export interface Package {
  name: string;
  version: string;
  id: string;
  license: any;
  license_file: any;
  description: any;
  source: any;
  dependencies: Dependency[];
  targets: Target[];
  features: Features;
  manifest_path: string;
  metadata: PackageMetadata;
  publish: any;
  authors: string[];
  categories: any[];
  keywords: any[];
  readme: string;
  repository: any;
  homepage: any;
  documentation: any;
  edition: string;
  links: any;
  default_run: any;
  rust_version: any;
}

/**
 * Cargo dependency information
 */
export interface Dependency {
  name: string;
  source: string;
  req: string;
  kind?: string;
  rename: any;
  optional: boolean;
  uses_default_features: boolean;
  features: string[];
  target: any;
  registry: any;
}

/**
 * Cargo target information
 */
export interface Target {
  kind: string[];
  crate_types: string[];
  name: string;
  src_path: string;
  edition: string;
  doc: boolean;
  doctest: boolean;
  test: boolean;
}

/**
 * Cargo features information
 */
export interface Features {
  backtraces: string[];
  library: any[];
}

/**
 * Cargo package metadata information
 */
export interface PackageMetadata {
  scripts: Scripts;
}

/**
 * Cargo package metadata scripts information
 */
export interface Scripts {
  optimize: string;
}

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

/**
 * Parameters for the {@link Cargo.generate} function
 */
export interface GenerateParams {
  name: string;
  repository: string;
  branch: string;
  template: string;
  destinationDir?: string;
  quiet?: boolean;
}

/**
 * Parameters for the {@link Cargo.build} function
 */
export interface BuildParams {
  release?: boolean;
  locked?: boolean;
  target?: string;
  lib?: boolean;
  quiet?: boolean;
}

/**
 * Parameters for the {@link Cargo.schema} function
 */
export interface SchemaParams {
  quiet?: boolean;
}
