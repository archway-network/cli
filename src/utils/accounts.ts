/**
 * Converts a public key from a plain Uint8 string into an encoded version
 *
 * @param value - Public key value
 * @param encoding - Optional - Encoding to use for the output
 * @returns The public key in a human readable format
 */
export const parsePublicKey = (value: string, encoding: BufferEncoding = 'base64'): string => {
  return Buffer.from(value.split(',').map(item => Number(item))).toString(encoding);
};
