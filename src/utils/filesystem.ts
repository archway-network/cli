import { Dirent, PathLike } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Stream } from 'node:stream';

/**
 * Read all the files in a directory, allows filtering by extension
 *
 * @param dirPath - Path to the directory where we want to read files from
 * @param extension - Optional - file extension to filter the files
 * @returns Promise containing the data in the files as an array of strings
 */
export async function readFilesFromDirectory(dirPath: PathLike, extension?: string): Promise<Record<string, string>> {
  const matchesFileAndExtension = (item: Dirent): boolean => item.isFile()
    && (!extension || path.extname(item.name) === extension);

  const filesList = await readdir(dirPath)
    .then(files => files.filter(item => matchesFileAndExtension(item)));

  // Reads all files in parallel
  const filesWithData = await Promise.all<string[]>(
    filesList.map(
      item => fs.readFile(
        path.join(dirPath.toString(), item.name),
        'utf8'
      ).then(data => [item.name, data])
    )
  );

  return Object.fromEntries(filesWithData.map(([name, data]) => [name, data]));
}

/**
 * Read all the names of subdirectories inside a directory
 *
 * @param dirPath - Path to the directory where we want to read subdirectories from
 * @returns Promise containing an array of subdirectory names
 */
export async function readSubDirectories(dirPath: PathLike): Promise<string[]> {
  const dirList = await readdir(dirPath)
    .then(files => files.filter(item => item.isDirectory()));

  // Return the names of the directories
  return dirList.map(item => path.join(dirPath.toString(), item.name));
}

async function readdir(dirPath: PathLike): Promise<Dirent[]> {
  try {
    const filesList = await fs.readdir(dirPath, { withFileTypes: true });
    return filesList || [];
  } catch {
    return [];
  }
}

export type FileData = AsyncIterable<NodeJS.ArrayBufferView | string> | Iterable<NodeJS.ArrayBufferView | string> | NodeJS.ArrayBufferView | Stream | string;

/**
 * Writes a file to disk, creating directories in the path if they don't exist
 *
 * @param filePath - Path where the file should be written
 * @param data - Data to be written into the file
 * @returns Empty promise
 */
export async function writeFileWithDir(filePath: string, data: FileData): Promise<void> {
  const dirPath = path.dirname(filePath);
  await fs.mkdir(dirPath, { recursive: true });

  return fs.writeFile(filePath, data);
}

/**
 * Check if a path exists or not
 *
 * @param pathLike - Path of the file to verify
 * @returns Promise containing true or false
 */
export async function pathExists(pathLike: PathLike): Promise<boolean> {
  try {
    await fs.access(pathLike);
    return true;
  } catch {
    return false;
  }
}
