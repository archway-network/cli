import { Dirent } from 'node:fs';
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
  let filesList: Dirent[] = [];

  try {
    filesList = (await fs.readdir(directoryPath, { withFileTypes: true })) || [];
  } catch {}

  // Filter files only, exclude directories
  filesList = filesList.filter(item => item.isFile());

  if (extension) filesList = filesList.filter(item => path.extname(item.name) === extension);

  const dataRead = await Promise.all<string>(filesList.map(item => fs.readFile(path.join(directoryPath, item.name), 'utf8')));
  const result: Record<string, any> = {};

  for (const [index, item] of filesList.entries()) {
    result[item.name] = dataRead[index];
  }

  return result;
};

/**
 * Read all the names of subdirectories inside a directory
 *
 * @param directoryPath - Path to the directory where we want to read subdirectories from
 * @returns Promise containing an array of subdirectory names
 */
export const readSubDirectories = async (directoryPath: string): Promise<string[]> => {
  let directoriesList: Dirent[] = [];

  try {
    directoriesList = (await fs.readdir(directoryPath, { withFileTypes: true })) || [];
  } catch {}

  // Filter directories only
  directoriesList = directoriesList.filter(item => item.isDirectory());

  // Return the names of the directories
  return directoriesList.map(item => path.join(directoryPath, item.name));
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

/**
 * Check if a chain file exists or not
 *
 * @param path - Path of the file to verify
 * @returns Promise containing true or false
 */
export const fileExists = async (path: string): Promise<boolean> => {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
};
