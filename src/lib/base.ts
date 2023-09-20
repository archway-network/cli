import { Command, Flags, Interfaces } from '@oclif/core';
import debugInstance from 'debug';

import { ConsoleError } from '@/exceptions';
import { PromptCanceledError } from '@/ui';
import { redBright, yellow } from '@/utils';

const debug = debugInstance('base-command');

enum LogLevel {
  debug = 'debug',
  info = 'info',
  warn = 'warn',
  error = 'error',
}

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<(typeof BaseCommand)['baseFlags'] & T['flags']>;
export type Args<T extends typeof Command> = Interfaces.InferredArgs<T['args']>;

export const SUCCESS_PREFIX = '✅';
export const ERROR_PREFIX = '❌';
export const WARNING_PREFIX = '⚠️';

/**
 * Base command that will be used across the CLI
 *
 * @public
 */
export abstract class BaseCommand<T extends typeof Command> extends Command {
  // add the --json flag
  static enableJsonFlag = true;

  // examples to show at the end of the command's help.
  static examples: Command.Example[] = ['<%= config.bin %> <%= command.id %>'];

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
  public warning(message: string | string[]): void {
    if (typeof message !== 'string') {
      for (const item of message) this.warning(item);
      return;
    }

    this.logToStderr(`${yellow(WARNING_PREFIX)} ${message}`);
  }

  /**
   * Logs a success message to console
   *
   * @param message - Success message to be printed
   */
  public success(message: string): void {
    this.log(`${SUCCESS_PREFIX} ${message}`);
  }

  /**
   * Log a JSON object
   *
   * @param message - One or more messages to be displayed as warnings in the console
   * @returns void
   */
  public logJson(json: unknown): void {
    super.logJson(json);
  }

  /**
   * Catches errors from commands, if they are an instance of {@link ConsoleError}, apply the formatting defined in the class.
   *
   * @param err - Error caught
   * @returns - Promise containing updated error object
   */
  protected async catch(err: Error & { exitCode?: number }): Promise<(Error & { exitCode?: number }) | undefined> {
    // Special case, if it is PromptCancelledError, display as a warning instead
    if (err instanceof PromptCanceledError) {
      this.warning(err.toConsoleString());
      return undefined;
    }

    debug('original error:', err);

    return super.catch(this.decorateError(err));
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

  /**
   * Optional function to log information of the transaction triggered by the command
   **/
  protected logTransactionDetails?(...args: any[]): Promise<void>;

  /**
   * Optional success message function
   */
  protected successMessage?(...args: any[]): Promise<void>;

  private decorateError(err: Error): Error {
    if (this.jsonEnabled()) {
      err.message = err instanceof ConsoleError ? err.toConsoleString() : (err as any)?.stderr || err.message;
    } else {
      const message = err instanceof ConsoleError ? err.toConsoleString() : redBright((err as any)?.stderr || err.message);
      err.message = `${ERROR_PREFIX} ${message}`;
    }

    return err;
  }

  protected toErrorJson(err: unknown): any {
    if (err instanceof ConsoleError || (err as any)?.stderr) {
      return { error: err };
    }

    return {
      error: {
        message: (err as any).message
      }
    };
  }
}
