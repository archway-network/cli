import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Read all the files in a directory, allows filtering by extension
 *
 * @param directoryPath - Path to the directory where we want to read files from
 * @param extension - Optional - file extension to filter the files
 * @returns Promise containing the data in the files as an array of strings
 */
export const readFilesFromDirectory = async (directoryPath: string, extension?: string): Promise<Record<string, string>> => {
  let filesList: string[];

  try {
    filesList = (await fs.readdir(directoryPath)) || [];
  } catch {
    filesList = [];
  }

  if (extension) filesList = filesList.filter(item => path.extname(item) === extension);

  const dataRead = await Promise.all<string>(filesList.map(item => fs.readFile(path.join(directoryPath, item), 'utf8')));
  const result: Record<string, any> = {};

  for (const [index, item] of filesList.entries()) {
    result[item] = dataRead[index];
  }

  return result;
};

/**
 * Writes a file to disk, creating directories in the path if they don't exist
 *
 * @param filePath - Path where the file should be written
 * @param data - Data to be written into the file
 * @returns Empty promise
 */
export const writeFileWithDir = async (filePath: string, data: string): Promise<void> => {
  const dirPath = path.dirname(filePath);

  let dirExists = true;

  try {
    await fs.access(dirPath);
  } catch {
    dirExists = false;
  }

  if (!dirExists) {
    await fs.mkdir(dirPath, { recursive: true });
  }

  return fs.writeFile(filePath, data);
};
