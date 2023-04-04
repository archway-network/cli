export abstract class ConsoleError extends Error {
  code: number;

  constructor(code: number) {
    super();
    this.code = code;
  }

  abstract toConsoleString(): string;
}
