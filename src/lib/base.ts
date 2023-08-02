import { Command, Flags, Interfaces } from '@oclif/core';

import { red, yellow } from '@/utils/style';
import { MESSAGES } from '@/config';
import { PromptCanceledError } from '@/ui/Prompt';

import { ConsoleError } from '@/types/ConsoleError';

enum LogLevel {
  debug = 'debug',
  info = 'info',
  warn = 'warn',
  error = 'error',
}

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<typeof BaseCommand['baseFlags'] & T['flags']>;
export type Args<T extends typeof Command> = Interfaces.InferredArgs<T['args']>;

/**
 * Base command that will be used across the CLI
 *
 * @public
 */
export abstract class BaseCommand<T extends typeof Command> extends Command {
  // add the --json flag
  static enableJsonFlag = true;

  // examples to show at the end of the command's help.
  static examples = ['<%= config.bin %> <%= command.id %>'];

  // define flags that can be inherited by any command that extends BaseCommand
  static baseFlags = {
    'log-level': Flags.custom<LogLevel>({
      summary: 'Specify level for logging.',
      options: Object.values(LogLevel),
      helpGroup: 'GLOBAL',
    })(),
  };

  protected flags!: Flags<T>;
  protected args!: Args<T>;

  /**
   * Initialize class, loading config and parsing arguments and flags
   *
   * @returns Empty promise
   */
  public async init(): Promise<void> {
    await super.init();
    const { args, flags } = await this.parse({
      flags: this.ctor.flags,
      baseFlags: (super.ctor as typeof BaseCommand).baseFlags,
      args: this.ctor.args,
      strict: this.ctor.strict,
    });
    this.flags = flags as Flags<T>;
    this.args = args as Args<T>;
  }

  /**
   * Log one or more warnings to console
   *
   * @param message - One or more messages to be displayed as warnings in the console
   * @returns void
   */
  protected warning(message: string | string[]): void {
    if (typeof message !== 'string') {
      for (const item of message) this.warning(item);
      return;
    }

    this.log(`${yellow(MESSAGES.WarningPrefix)} ${message}`);
  }

  /**
   * Logs a success message to console
   *
   * @param message - Success message to be printed
   */
  protected success(message: string): void {
    this.log(`${MESSAGES.SuccessPrefix} ${message}`);
  }

  /**
   * Catches errors from commands, if they are an instance of {@link ConsoleError}, apply the formatting defined in the class.
   *
   * @param err - Error caught
   * @returns - Promise containing updated error object
   */
  protected async catch(err: Error & { exitCode?: number }): Promise<Error & { exitCode?: number } | undefined> {
    // Special case, if it is PromptCancelledError, display as a warning instead
    if (err instanceof PromptCanceledError) {
      this.warning(err.toConsoleString());
      return undefined;
    }

    err.message = `${MESSAGES.ErrorPrefix} ${err instanceof ConsoleError ? err.toConsoleString() : red((err as any)?.stderr || err.message)}`;
    return super.catch(err);
  }

  /**
   * Called after run and catch regardless of whether or not the command errored
   *
   * @param _ - Error found, if no error found it is undefined
   * @returns - Promise containing any result
   */
  protected async finally(_: Error | undefined): Promise<any> {
    return super.finally(_);
  }
}
