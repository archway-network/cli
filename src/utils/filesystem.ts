import fs from 'node:fs/promises';
import path from 'node:path';

export const readFilesFromDirectory = async (directoryPath: string, extension?: string): Promise<Record<string, string>> => {
  let filesList = await fs.readdir(directoryPath);

  if (extension) filesList = filesList.filter(item => path.extname(item) === extension);

  const dataRead = await Promise.all<string>(filesList.map(item => fs.readFile(path.join(directoryPath, item), 'utf8')));
  const result: Record<string, any> = {};

  for (const [index, item] of filesList.entries()) {
    result[item] = dataRead[index];
  }

  return result;
};
