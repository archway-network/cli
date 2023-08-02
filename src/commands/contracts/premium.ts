import { SetContractPremiumResult } from '@archwayhq/arch3.js';

import { BaseCommand } from '@/lib/base';
import { contractNameRequired } from '@/arguments/contract';
import { Config } from '@/domain/Config';
import { blue, green } from '@/utils/style';
import { buildStdFee } from '@/utils/coin';
import { showSpinner } from '@/ui/Spinner';
import { TransactionFlags } from '@/flags/transaction';
import { Accounts } from '@/domain/Accounts';
import { KeyringFlags } from '@/flags/keyring';
import { NotFoundError } from '@/exceptions';
import { amountRequired } from '@/flags/amount';

import { AccountWithMnemonic, BackendType } from '@/types/Account';
import { DeploymentAction, PremiumDeployment } from '@/types/Deployment';

/**
 * Command 'contracts premium'
 * Sets a contract premium flat fee for a contract
 */
export default class ContractsPremium extends BaseCommand<typeof ContractsPremium> {
  static summary = 'Sets a contract premium flat fee for a contract';
  static args = {
    contract: contractNameRequired,
  };

  static flags = {
    'premium-fee': amountRequired(),
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
    const config = await Config.open();
    await config.contractsInstance.assertValidWorkspace();
    const contract = config.contractsInstance.assertGetContractByName(this.args.contract!);
    const accountsDomain = await Accounts.init(this.flags['keyring-backend'] as BackendType, { filesPath: this.flags['keyring-path'] });
    const fromAccount: AccountWithMnemonic = await accountsDomain.getWithMnemonic(this.flags.from!);

    const instantiated = await config.contractsInstance.findInstantiateDeployment(this.args.contract!, config.chainId);

    if (!instantiated) throw new NotFoundError('Instantiated deployment with a contract address');

    const contractAddress = instantiated.contract.address;

    // Log message that we are starting the transaction
    this.log(`Setting premium for contract ${blue(contract.name)}`);
    this.log(`  Chain: ${blue(config.chainId)}`);
    this.log(`  Contract: ${blue(contractAddress)}`);
    this.log(`  Premium: ${blue(this.flags['premium-fee']!.plainText)}`);
    this.log(`  Signer: ${blue(fromAccount.name)}\n`);

    let result: SetContractPremiumResult;

    await showSpinner(async () => {
      const signingClient = await config.getSigningArchwayClient(fromAccount);

      result = await signingClient.setContractPremium(
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

    if (this.jsonEnabled()) {
      this.logJson(result!);
    }

    this.success(`${green('Premium for the contract')} ${blue(contract.label)} ${green('updated')}`);
    this.log(`  Transaction: ${await config.prettyPrintTxHash(result!.transactionHash)}`);
  }
}
