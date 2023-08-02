import { SetContractPremiumResult } from '@archwayhq/arch3.js';

import { BaseCommand } from '@/lib/base';
import { ContractNameRequiredArg } from '@/arguments';
import { Accounts, Config } from '@/domain';
import { buildStdFee, blue } from '@/utils';
import { showSpinner } from '@/ui';
import { KeyringFlags, TransactionFlags, AmountRequiredFlag } from '@/flags';
import { NotFoundError } from '@/exceptions';
import { SuccessMessages } from '@/services';

import { Account, BackendType, DeploymentAction, PremiumDeployment } from '@/types';

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
    await config.contractsInstance.assertValidWorkspace();
    const contract = config.contractsInstance.assertGetContractByName(this.args.contract!);
    const accountsDomain = await Accounts.init(this.flags['keyring-backend'] as BackendType, { filesPath: this.flags['keyring-path'] });
    const fromAccount: Account = await accountsDomain.getWithMnemonic(this.flags.from!);

    const instantiated = config.contractsInstance.findInstantiateDeployment(this.args.contract!, config.chainId);

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

    await SuccessMessages.contracts.premium(this, result!, contract.label, config);
  }
}
