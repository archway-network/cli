/**
 * Console Error class used across the CLI
 */
export abstract class ConsoleError extends Error {
  code: number;

  /**
   * @param code - Error code
   */
  constructor(code: number) {
    super();
    this.code = code;
  }

  /**
   * Formats the error so it can be printed to the console
   *
   * @returns Console printable version of the error
   */
  abstract toConsoleString(): string;
}
