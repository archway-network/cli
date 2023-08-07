import { Flags } from '@oclif/core';
import fs from 'node:fs/promises';
import { UploadResult } from '@cosmjs/cosmwasm-stargate';

import { BaseCommand } from '@/lib/base';
import { ContractNameRequiredArg } from '@/arguments';
import { Accounts, Config } from '@/domain';
import { askForConfirmation, buildStdFee, blue, white, yellow } from '@/utils';
import { KeyringFlags, TransactionFlags } from '@/flags';
import { showSpinner } from '@/ui';
import { SuccessMessages } from '@/services';

import { Account, BackendType, InstantiatePermission, DeploymentAction, StoreDeployment } from '@/types';

/**
 * Command 'contracts store'
 * Stores a WASM file on-chain
 */
export default class ContractsStore extends BaseCommand<typeof ContractsStore> {
  static summary = 'Stores a WASM file on-chain';
  static args = {
    contract: ContractNameRequiredArg,
  };

  static flags = {
    'instantiate-permission': Flags.string({
      options: Object.values(InstantiatePermission),
      default: InstantiatePermission.EVERYBODY,
      description: 'Controls the instantiation permissions for the stored wasm file',
    }),
    'allowed-addresses': Flags.custom<string[]>({
      parse: async (val: string) => val.split(','),
      description:
        'List of addresses that can instantiate a contract from the code; works only if the instantiate permission is set to "any-of"',
    })(),
    ...KeyringFlags,
    ...TransactionFlags,
  };

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const config = await Config.init();

    await config.assertIsValidWorkspace();
    const contract = config.contractsInstance.getContractByName(this.args.contract!);

    const existingDeployment = await config.contractsInstance.isChecksumAlreadyDeployed(this.args.contract!, config.chainId);

    if (existingDeployment) {
      this.warning(
        yellow(
          `The current optimized build of the contract ${this.args.contract} with checksum ${white.reset(
            existingDeployment.wasm.checksum
          )} has already been deployed to ${white.reset(config.chainId)}`
        )
      );
      await askForConfirmation();
    }

    const accountsDomain = await Accounts.init(this.flags['keyring-backend'] as BackendType, { filesPath: this.flags['keyring-path'] });
    const fromAccount: Account = await accountsDomain.getWithMnemonic(this.flags.from!);
    const wasmCode = await fs.readFile(contract.wasm.optimizedFilePath);

    this.log(`Uploading optimized wasm for contract ${blue(contract.name)}`);
    this.log(`  Chain: ${blue(config.chainId)}`);
    this.log(`  Signer: ${blue(fromAccount.name)}\n`);

    let result: UploadResult;

    await showSpinner(async () => {
      const signingClient = await config.getSigningArchwayClient(fromAccount);

      result = await signingClient.upload(fromAccount.address, wasmCode, buildStdFee(this.flags.fee?.coin));
    }, 'Waiting for tx to confirm...');

    await config.deploymentsInstance.addDeployment(
      {
        action: DeploymentAction.STORE,
        txhash: result!.transactionHash,
        wasm: {
          codeId: result!.codeId,
          checksum: result!.checksum,
        },
        contract: {
          name: contract.name,
          version: contract.version,
        },
      } as StoreDeployment,
      config.chainId
    );

    await SuccessMessages.contracts.store(this, result!, contract, config);
  }
}
