import { promisify } from 'node:util';
import { exec } from 'node:child_process';

export const getRepositoryRoot = async (): Promise<string | undefined> => {
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

export const getWokspaceRoot = async (): Promise<string> => {
  const repositoryRoot = await getRepositoryRoot();

  return repositoryRoot || process.cwd();
};
