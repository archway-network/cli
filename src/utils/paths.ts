import _ from 'lodash';
import { exec } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

/**
 * Get the git repository root path
 *
 * @returns Promise containing the path or undefined if not found
 */
async function _getRepositoryRoot(): Promise<string | undefined> {
  try {
    const result = await promisify(exec)('git rev-parse --show-toplevel');
    if (result.stderr) {
      return undefined;
    }

    return result.stdout.trim();
  } catch {
    return undefined;
  }
}

/**
 * {@inheritDoc _getRepositoryRoot}
 */
export const getRepositoryRoot = _.memoize(_getRepositoryRoot);

/**
 * Get the workspace root, which is the git repository root or otherwise the current directory
 *
 * @param workingDir - Optional - Can override the workspace root value
 * @returns Promise containing the workspace root
 */
export async function getWorkspaceRoot(workingDir?: string): Promise<string> {
  const repositoryRoot = (workingDir && path.resolve(workingDir)) || (await getRepositoryRoot());

  return repositoryRoot || process.cwd();
}

/**
 * Sanitizes a directory name, replacing spaces and underscore for hyphens
 *
 * @param value - Name to sanitize
 * @returns Sanitized name
 */
export function sanitizeDirName(value: string): string {
  return value.toLowerCase().replace(/_/g, '-').replace(/ /g, '-');
}
