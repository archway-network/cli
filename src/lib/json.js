/**
 * Monkey-patch BigInt.prototype.toJSON to return a string representation of the BigInt.
 *
 * @returns The string representation of the BigInt.
 */
// eslint-disable-next-line no-extend-native
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// /**
//  * Stringify a BigInt value to a string.
//  *
//  * @param _key - The key of the value to be stringified.
//  * @param value - The value to be stringified.
//  * @returns The string representation of the BigInt.
//  */
// // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
// export function stringifyBigInt(_key, value) {
//   // eslint-disable-next-line @typescript-eslint/no-unsafe-return
//   return (typeof value === 'bigint') ? value.toString() : value;
// }

/**
 * Stringify a JavaScript value to a JSON string with support for BigInt.
 *
 * @param {any} data - The value to be stringified.
 * @param {number | undefined} space - The number of spaces to use for indentation.
 * @returns {string} The JSON string representation of the value.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function jsonStringify(data, space = undefined) {
  return JSON.stringify(data, undefined, space);
}
