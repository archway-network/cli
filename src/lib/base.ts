import { Command, Flags, Interfaces } from '@oclif/core';
import { ConsoleError } from '../types/ConsoleError';
import { red, yellow } from '../utils/style';
import { MESSAGES } from '../config';

enum LogLevel {
  debug = 'debug',
  info = 'info',
  warn = 'warn',
  error = 'error',
}

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<typeof BaseCommand['baseFlags'] & T['flags']>;
export type Args<T extends typeof Command> = Interfaces.InferredArgs<T['args']>;

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

  protected warning(message: string | string[]): void {
    if (typeof message !== 'string') {
      for (const item of message) this.warning(item);
      return;
    }

    this.log(`${yellow(MESSAGES.WarningPrefix)}${message}`);
  }

  protected success(message: string): void {
    this.log(`${MESSAGES.SuccessPrefix}${message}`);
  }

  protected async catch(err: Error & { exitCode?: number }): Promise<any> {
    // add any custom logic to handle errors from the command
    // or simply return the parent class error handling
    err.message = `${MESSAGES.ErrorPrefix}${err instanceof ConsoleError ? err.toConsoleString() : red(err.message)}`;
    return super.catch(err);
  }

  protected async finally(_: Error | undefined): Promise<any> {
    // called after run and catch regardless of whether or not the command errored
    return super.finally(_);
  }
}
