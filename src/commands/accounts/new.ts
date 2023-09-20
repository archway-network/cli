import { Args, Flags } from '@oclif/core';

import { Accounts, Config } from '@/domain';
import { BaseCommand } from '@/lib/base';
import { ParamsAccountOptionalArg, StdinInputArg } from '@/parameters/arguments';
import { CustomFlags, KeyringFlags } from '@/parameters/flags';
import { bold, dim, green, greenBright, yellow } from '@/utils';
import { Prompts } from '@/services';

import { Account, AccountType } from '@/types';

/**
 * Command 'accounts new'
 * Adds a new wallet to the keyring. It requires a name and will generate a new mnemonic (if not provided) to create the wallet's private keys
 */
export default class AccountsNew extends BaseCommand<typeof AccountsNew> {
  static summary = 'Adds a new wallet to the keyring';
  static args = {
    'account-name': Args.string({ ...ParamsAccountOptionalArg, ignoreStdin: true }),
    stdinInput: StdinInputArg,
  };

  static flags = {
    ledger: Flags.boolean({
      description: 'Add an account from a ledger device',
      exclusive: ['recover'],
    }),
    'hd-path': CustomFlags.hdPath(),
    recover: Flags.boolean({
      exclusive: ['ledger'],
      description: 'Enables the recovery of an account from a mnemonic or a private key',
    }),
    ...KeyringFlags,
  };

  static examples = [
    {
      description: 'Create a new account with a random mnemonic',
      command: '<%= config.bin %> <%= command.id %>',
    },
    {
      description: 'Create a new account with a random mnemonic and account name',
      command: '<%= config.bin %> <%= command.id %> alice',
    },
    {
      description: 'Create a new account with a random mnemonic and a custom HD path',
      command: '<%= config.bin %> <%= command.id %> alice --hd-path "m/44\'/60\'/1\'/0/0"',
    },
    {
      description: 'Create a new account from a ledger device',
      command: '<%= config.bin %> <%= command.id %> alice --ledger',
    },
    {
      description: 'Create a new account from a ledger device and a custom HD path',
      command: '<%= config.bin %> <%= command.id %> alice --ledger --hd-path "m/44\'/118\'/1\'/0/0"',
    },
    {
      description: 'Recover an account from a private key exported in unarmored hex format',
      // For some reason, oclif only colours the examples starting with `archway`
      command: dim('$ yes | archwayd keys export --unarmored-hex --unsafe alice | <%= config.bin %> <%= command.id %> alice --recover'),
    },
    {
      description: 'Recover an account from a mnemonic',
      command: dim('$ echo "fruit rose..." | <%= config.bin %> <%= command.id %> alice --recover'),
    },
    {
      description: 'Recover a Terra Station account from a mnemonic and custom HD path',
      // For some reason, oclif only colours the examples starting with `archway`
      command: dim('$ echo "fruit rose ..." | <%= config.bin %> <%= command.id %> alice --recover --hd-path "m/44\'/330\'/0\'/0/0"'),
    },
  ];

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const [account, mnemonic] = await this.createOrRecoverAccount();
    await this.successMessage(account, mnemonic);
  }

  private async createOrRecoverAccount(): Promise<[Account, string?]> {
    const config = await Config.init();
    const accountsDomain = await Accounts.initFromFlags(this.flags, config);

    const accountName = this.args['account-name'] || (await Prompts.newAccount());
    const type = this.flags.ledger ? AccountType.LEDGER : AccountType.LOCAL;
    const hdPath = this.flags['hd-path']!;

    if (this.flags.recover) {
      const mnemonicOrPrivateKey = this.args.stdinInput || (await Prompts.mnemonicOrPrivateKey());
      const account = await accountsDomain.import(accountName, hdPath, mnemonicOrPrivateKey);
      return [account];
    }

    return accountsDomain.new(accountName, type, hdPath);
  }

  protected async successMessage(account: Account, mnemonic?: string): Promise<void> {
    if (this.jsonEnabled()) {
      this.logJson({ ...account, mnemonic });
    } else {
      this.success(`${green('Account')} ${greenBright(account.name)} successfully created!`);

      this.log(`\nAddress: ${greenBright(account.address)}\n`);
      this.log(Accounts.prettyPrintPublicKey(account.publicKey));

      if (account.type === AccountType.LOCAL && mnemonic) {
        this.log(`\n${bold('Recovery phrase:')} ${mnemonic}\n`);
        this.warning(
          `${yellow('Important:')} write this mnemonic phrase in a safe place. It is the ${bold(
            'only'
          )} way to recover your account if you forget your password.`
        );
      }

      if (account.type === AccountType.LEDGER) {
        this.log();
        this.warning(yellow('Ledger account'));
      }
    }
  }
}
