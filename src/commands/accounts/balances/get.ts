import { BaseCommand } from '@/lib/base';
import { AccountRequiredArg } from '@/arguments';
import { KeyringFlags } from '@/flags';
import { Accounts, Config } from '@/domain';
import { showSpinner } from '@/ui';
import { SuccessMessages } from '@/services';

import { BackendType } from '@/types';

/**
 * Command 'accounts balances get'
 * Access the bank module to query the balance of an address or account.
 */
export default class AccountsBalancesGet extends BaseCommand<typeof AccountsBalancesGet> {
  static summary = 'Query the balance of an address or account';
  static args = {
    account: AccountRequiredArg,
  };

  static flags = {
    ...KeyringFlags,
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const accountsDomain = await Accounts.init(this.flags['keyring-backend'] as BackendType, { filesPath: this.flags['keyring-path'] });
    const config = await Config.init();

    const result = await showSpinner(async () => {
      const client = await config.getStargateClient();

      return accountsDomain.queryBalance(client, this.args.account!);
    }, 'Querying balance');

    SuccessMessages.accounts.balances.get(this, result)
  }
}
