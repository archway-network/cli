/**
 * Sanitizes a directory name, replacing spaces and underscore for hyphens
 *
 * @param value - Name to sanitize
 * @returns Sanitized name
 */
export const sanitizeDirName = (value: string): string => {
  return value.toLowerCase().replace(/_/g, '-').replace(/ /g, '-');
};

/**
 * If an error message matches the format of a cosmwasm error message, sanitizes it
 *
 * @param message - Error message
 * @returns Sanitized error message
 */
export const sanitizeCosmWasmError = (message: string): string => {
  const regex = /.*desc = failed to execute message; message index: 0: (.*) : unknown request/;
  const newMessage = message.match(regex)?.[1];

  return newMessage ? newMessage.charAt(0).toUpperCase() + newMessage.slice(1) : message;
}
