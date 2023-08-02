import path from 'node:path';
import { ExecuteResult, InstantiateResult, JsonObject, MigrateResult, UploadResult } from '@cosmjs/cosmwasm-stargate';
import {
  OutstandingRewards,
  SetContractMetadataResult,
  SetContractPremiumResult,
  WithdrawContractRewardsResult,
} from '@archwayhq/arch3.js';

import { Accounts, ChainRegistry, Config, Contracts } from '@/domain';
import { BaseCommand } from '@/lib/base';
import { blue, bold, cyan, darkGreen, green, white, yellow } from '@/utils';
import { DEFAULT } from '@/GlobalConfig';

import { Account, AccountBalancesJSON, AccountBase, AccountWithMnemonic, Amount, Contract } from '@/types';

export const SuccessMessages = {
  accounts: {
    balances: {
      get: (command: BaseCommand<any>, balance: AccountBalancesJSON): void => {
        if (command.jsonEnabled()) {
          command.logJson(balance);
        } else {
          command.log(`Balances for account ${green(balance.account.name)} (${darkGreen(balance.account.address)})\n`);
          if (balance.account.balances.length === 0) command.log(`- ${yellow('Empty wallet')}`);
          for (const item of balance.account.balances) command.log(`- ${bold(item.amount)}${item.denom}`);
        }
      },
      send: (command: BaseCommand<any>, amount: Amount, from: AccountWithMnemonic, to: AccountBase): void => {
        command.success(
          darkGreen(`Sent ${white.reset.bold(amount.plainText)} from ${green(from.name)} to ${green(to.name || to.address)}`)
        );
      },
    },
    get: (command: BaseCommand<any>, account: Account, showAddress?: boolean): void => {
      if (showAddress) {
        command.log(account.address);
        if (command.jsonEnabled()) command.logJson({ account: { address: account.address } });
      } else {
        command.log(`${Accounts.prettyPrintNameAndAddress(account)}\n\n${Accounts.prettyPrintPublicKey(account.publicKey)}`);
        if (command.jsonEnabled()) command.logJson(account);
      }
    },
    list: async (command: BaseCommand<any>, accountsDomain: Accounts): Promise<void> => {
      if (command.jsonEnabled()) {
        const list = await accountsDomain.list();

        command.logJson({ accounts: list });
      } else {
        const list = await accountsDomain.listNameAndAddress();

        for (const item of list) {
          command.log(`${Accounts.prettyPrintNameAndAddress(item)}\n`);
        }

        if (list.length === 0) command.log(yellow('No accounts found'));
      }
    },
    new: (command: BaseCommand<any>, account: AccountWithMnemonic): void => {
      if (command.jsonEnabled()) {
        command.logJson(account);
      } else {
        command.success(`${darkGreen('Account')} ${green(account.name)} successfully created!`);
        command.log(`\nAddress: ${green(account.address)}\n`);
        command.log(Accounts.prettyPrintPublicKey(account.publicKey));
        command.log(`\n${bold('Mnemonic:')} ${account.mnemonic}\n`);
        command.warning(
          `${yellow('Important:')} write this mnemonic phrase in a safe place. It is the ${bold(
            'only'
          )} way to recover your account if you forget your password.`
        );
      }
    },
    remove: (command: BaseCommand<any>, account: AccountBase): void => {
      command.success(`${darkGreen('Account')} ${bold.green(account.name)} ${darkGreen('deleted')}`);
    },
  },
  chains: {
    export: (command: BaseCommand<any>, chainRegistry: ChainRegistry, chainId: string): void => {
      command.success(`${green('Exported chain to')} ${bold(path.join(chainRegistry.path, `./${chainId}.json`))}`);
    },
    import: (command: BaseCommand<any>, chainId: string): void => {
      command.success(`${green('Imported chain')} ${bold(chainId)}`);
    },
    use: (command: BaseCommand<any>, chainId: string): void => {
      command.success(`${green('Switched chain to')} ${bold(chainId)}`);
    },
  },
  contracts: {
    query: {
      balance: (command: BaseCommand<any>, balances: AccountBalancesJSON[]): void => {
        if (command.jsonEnabled()) {
          command.logJson({ contracts: balances });
        } else {
          for (const item of balances) {
            command.log(`${Contracts.prettyPrintBalances(item)}`);
          }
        }
      },
      smart: (command: BaseCommand<any>, result: JsonObject): void => {
        command.logJson(result!);
      },
    },
    build: {
      default: (command: BaseCommand<any>, outputPath: string): void => {
        command.success(`Wasm binary saved to ${cyan(outputPath)}}}`);
      },
      optimize: (command: BaseCommand<any>, outputPath: string): void => {
        command.success(`Optimized Wasm binary saved to ${cyan(outputPath)}}}`);
      },
      schemas: (command: BaseCommand<any>): void => {
        command.success('Schemas generated');
      },
    },
    execute: async (
      command: BaseCommand<any>,
      result: ExecuteResult,
      contractInstance: Contract,
      configInstance: Config
    ): Promise<void> => {
      if (command.jsonEnabled()) {
        command.logJson(result!);
      } else {
        command.success(`${green('Executed contract ')} ${blue(contractInstance.label)}`);
        command.log(`  Transaction: ${await configInstance.prettyPrintTxHash(result.transactionHash)}`);
      }
    },
    instantiate: async (command: BaseCommand<any>, result: InstantiateResult, label: string, configInstance: Config): Promise<void> => {
      if (command.jsonEnabled()) {
        command.logJson(result);
      } else {
        command.success(`${green('Contract')} ${blue(label)} ${green('instantiated')}`);
        command.log(`  Address: ${blue(result.contractAddress)}`);
        command.log(`  Transaction: ${await configInstance.prettyPrintTxHash(result.transactionHash)}`);
      }
    },
    metadata: async (
      command: BaseCommand<any>,
      result: SetContractMetadataResult,
      label: string,
      configInstance: Config
    ): Promise<void> => {
      if (command.jsonEnabled()) {
        command.logJson(result!);
      } else {
        command.success(`${green('Metadata for the contract')} ${blue(label)} ${green('updated')}`);
        command.log(`  Transaction: ${await configInstance.prettyPrintTxHash(result.transactionHash)}`);
      }
    },
    migrate: async (command: BaseCommand<any>, result: MigrateResult, label: string, configInstance: Config): Promise<void> => {
      if (command.jsonEnabled()) {
        command.logJson(result!);
      } else {
        command.success(`${green('Contract')} ${blue(label)} ${green('migrated')}`);
        command.log(`  Transaction: ${await configInstance.prettyPrintTxHash(result.transactionHash)}`);
      }
    },
    new: (command: BaseCommand<any>, contractName: string, template?: string): void => {
      command.success(
        `${darkGreen('Contract')} ${green(contractName)} ${darkGreen('created from template')} ${green(template || DEFAULT.Template)}`
      );
    },
    premium: async (command: BaseCommand<any>, result: SetContractPremiumResult, label: string, configInstance: Config): Promise<void> => {
      if (command.jsonEnabled()) {
        command.logJson(result!);
      } else {
        command.success(`${green('Premium for the contract')} ${blue(label)} ${green('updated')}`);
        command.log(`  Transaction: ${await configInstance.prettyPrintTxHash(result.transactionHash)}`);
      }
    },
    store: async (command: BaseCommand<any>, result: UploadResult, contractInstance: Contract, configInstance: Config): Promise<void> => {
      if (command.jsonEnabled()) {
        command.logJson(result!);
      } else {
        command.success(`${green('Contract')} ${blue(path.basename(contractInstance.wasm.optimizedFilePath))} ${green('uploaded')}`);
        command.log(`  Code Id: ${blue(result.codeId)}`);
        command.log(`  Transaction: ${await configInstance.prettyPrintTxHash(result.transactionHash)}`);
      }
    },
  },
  rewards: {
    query: (command: BaseCommand<any>, result: OutstandingRewards, account: AccountBase): void => {
      if (command.jsonEnabled()) {
        command.logJson(result);
      } else {
        command.log(
          `Outstanding rewards for ${account.name ? `${green(account.name)} (${darkGreen(account.address)})` : green(account.address)}\n`
        );
        if (result.totalRewards.length === 0) command.log(`- ${yellow('No outstanding rewards')}`);
        for (const item of result.totalRewards) command.log(`- ${bold(item.amount)}${item.denom}`);
      }
    },
    withdraw: (command: BaseCommand<any>, result: WithdrawContractRewardsResult): void => {
      if (result.rewards.length === 0) {
        command.log(yellow('No outstanding rewards'));
      } else {
        command.success(darkGreen('Successfully claimed the following rewards:\n'));
        for (const item of result.rewards) command.log(`- ${bold(item.amount)}${item.denom}`);
      }
    },
  },
  new: (command: BaseCommand<any>, projectName: string, chainId: string): void => {
    command.success(`${darkGreen('Project')} ${green(projectName)} ${darkGreen('created and configured for the chain')} ${green(chainId)}`);
  },
};
