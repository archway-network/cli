import { promisify } from 'node:util';
import { exec } from 'node:child_process';
import _ from 'lodash';

/**
 * Get the git repository root path
 *
 * @returns Promise containing the path or undefined if not found
 */
const _getRepositoryRoot = async (): Promise<string | undefined> => {
  try {
    const result = await promisify(exec)('git rev-parse --show-toplevel');
    if (result.stderr) {
      return undefined;
    }

    return result.stdout.trim();
  } catch {
    return undefined;
  }
};

/**
 * {@inheritDoc _getRepositoryRoot}
 */
export const getRepositoryRoot = _.memoize(_getRepositoryRoot)

/**
 * Get the workspace root, which is the git repository root or otherwise the current directory
 *
 * @returns Promise containing the workspace root
 */
export const getWorkspaceRoot = async (): Promise<string> => {
  const repositoryRoot = await getRepositoryRoot();

  return repositoryRoot || process.cwd();
};
