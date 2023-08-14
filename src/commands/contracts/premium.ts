import { SetContractPremiumResult } from '@archwayhq/arch3.js';

import { BaseCommand } from '@/lib/base';
import { ContractNameRequiredArg } from '@/parameters/arguments';
import { Accounts, Config } from '@/domain';
import { buildStdFee, blue, green } from '@/utils';
import { showDisappearingSpinner } from '@/ui';
import { KeyringFlags, TransactionFlags, AmountRequiredFlag } from '@/parameters/flags';
import { NotFoundError } from '@/exceptions';

import { Account, BackendType, Contract, DeploymentAction, PremiumDeployment } from '@/types';

/**
 * Command 'contracts premium'
 * Sets a contract premium flat fee for a contract
 */
export default class ContractsPremium extends BaseCommand<typeof ContractsPremium> {
  static summary = 'Sets a contract premium flat fee for a contract';
  static args = {
    contract: ContractNameRequiredArg,
  };

  static flags = {
    'premium-fee': AmountRequiredFlag,
    ...KeyringFlags,
    ...TransactionFlags,
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    // Load config and contract info
    const config = await Config.init();
    await config.assertIsValidWorkspace();
    const contract = config.contractsInstance.getContractByName(this.args.contract!);
    const accountsDomain = await Accounts.init(this.flags['keyring-backend'] as BackendType, { filesPath: this.flags['keyring-path'] });
    const fromAccount: Account = await accountsDomain.getWithMnemonic(this.flags.from!);

    const instantiated = config.contractsInstance.findInstantiateDeployment(this.args.contract!, config.chainId);

    if (!instantiated) throw new NotFoundError('Instantiated deployment with a contract address');

    const contractAddress = instantiated.contract.address;

    await this.logTransactionDetails(config, contract, contractAddress, fromAccount);

    const result = await showDisappearingSpinner(async () => {
      const signingClient = await config.getSigningArchwayClient(fromAccount);

      return signingClient.setContractPremium(
        fromAccount.address,
        contractAddress,
        this.flags['premium-fee']!.coin,
        buildStdFee(this.flags.fee?.coin)
      );
    }, 'Waiting for tx to confirm...');

    await config.deploymentsInstance.addDeployment(
      {
        action: DeploymentAction.PREMIUM,
        txhash: result!.transactionHash,
        wasm: {
          codeId: instantiated.wasm.codeId,
        },
        contract: {
          name: contract.name,
          version: contract.version,
          address: contractAddress,
          admin: instantiated.contract.admin,
        },
        flatFee: result!.premium.flatFee,
      } as PremiumDeployment,
      config.chainId
    );

    await this.successMessage(result!, contract.label, config);
  }

  protected async logTransactionDetails(config: Config, contract: Contract, contractAddress: string, fromAccount: Account): Promise<void> {
    this.log(`Setting premium for contract ${blue(contract.name)}`);
    this.log(`  Chain: ${blue(config.chainId)}`);
    this.log(`  Contract: ${blue(contractAddress)}`);
    this.log(`  Premium: ${blue(this.flags['premium-fee']!.plainText)}`);
    this.log(`  Signer: ${blue(fromAccount.name)}\n`);
  }

  protected async successMessage(result: SetContractPremiumResult, label: string, configInstance: Config): Promise<void> {
    if (this.jsonEnabled()) {
      this.logJson(result);
    } else {
      this.success(`${green('Premium for the contract')} ${blue(label)} ${green('updated')}`);
      this.log(`  Transaction: ${await configInstance.prettyPrintTxHash(result.transactionHash)}`);
    }
  }
}
