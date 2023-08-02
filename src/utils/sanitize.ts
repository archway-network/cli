/**
 * Sanitizes a directory name, replacing spaces and underscore for hyphens
 *
 * @param value - Name to sanitize
 * @returns Sanitized name
 */
export const sanitizeDirName = (value: string): string => {
  return value.toLowerCase().replace(/_/g, '-').replace(/ /g, '-');
};
