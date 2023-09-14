import { BaseCommand } from '@/lib/base';
import { ContractNameOptionalArg } from '@/parameters/arguments';
import { TemplateOptionalFlag } from '@/parameters/flags';
import { Config } from '@/domain';
import { dim, green, greenBright } from '@/utils';
import { Prompts } from '@/services';

/**
 * Command 'contracts new'
 * Initializes a new smart contract from a template
 */
export default class ContractsNew extends BaseCommand<typeof ContractsNew> {
  static summary = 'Scaffolds a new Wasm smart contract from a template';
  static args = {
    'contract-name': ContractNameOptionalArg,
  };

  static flags = {
    template: TemplateOptionalFlag,
  };

  static examples = [
    {
      description: 'Create a new contract in the current project',
      command: '<%= config.bin %> <%= command.id %>',
    },
    {
      description: 'Create a new contract in the current project, with contract name',
      command: '<%= config.bin %> <%= command.id %> --contract-name "other-contract"',
    },
    {
      description: 'Create a new contract, with cw-20 template',
      command: '<%= config.bin %> <%= command.id %> --contract-name="other-contract" --template="cw-20/base"',
    },
    {
      description: 'Create a new contract, with increment template',
      command: dim('$ CARGO_GENERATE_VALUE_VERSION=full <%= config.bin %> <%= command.id %> --contract-name="other-contract" --template="increment"'),
    },
  ];

  /**
   * Runs the command.
   *
   * @returns Empty promise
   */
  public async run(): Promise<void> {
    const contractName = this.args['contract-name'] || (await Prompts.newContract());

    this.log(`Creating new contract ${contractName}...\n`);

    const config = await Config.init();

    await config.assertIsValidWorkspace();

    const templateName = this.flags.template || (await Prompts.template());

    await config.contractsInstance.create(contractName, templateName, this.jsonEnabled());

    await this.successMessage(contractName, templateName);
  }

  protected async successMessage(contractName: string, template: string): Promise<void> {
    this.success(`${green('Contract')} ${greenBright(contractName)} ${green('created from template')} ${greenBright(template)}`);

    if (this.jsonEnabled()) this.logJson({ name: contractName, template });
  }
}
