/* eslint-disable import/order */

import fs from 'node:fs/promises';
import path from 'node:path';

import debugInstance from 'debug';

import Ajv, { Format, Options, Schema } from 'ajv';
import addFormats from 'ajv-formats';
import Ajv2019 from 'ajv/dist/2019';
// eslint-disable-next-line node/file-extension-in-import
import draft7MetaSchema from 'ajv/dist/refs/json-schema-draft-07.json';

const debug = debugInstance('schema-validation');

export class SchemaValidationError extends Error {
  constructor(ajv: Ajv) {
    super(ajv.errorsText(ajv.errors));
    this.name = 'SchemaValidationError';
  }
}

export class SchemaValidator {
  private extraOpts: Options = {};

  public withOptions(opts: Options): this {
    this.extraOpts = { ...this.extraOpts, ...opts };
    return this;
  }

  public addFormats(formats: CustomFormats): this {
    return this.withOptions({
      formats: {
        ...this.extraOpts.formats,
        ...formats
      }
    });
  }

  public withCosmWasmFormats(): this {
    return this.addFormats(CosmWasmFormatsDefinition);
  }

  /**
   * Validates a JSON schema against a given data.
   *
   * @param schemaPath - Path to the schema file.
   * @param data - The data to validate.
   *
   * @throws A {@link SchemaValidationError} if the data is not valid.
   */
  async assertValidJSONSchema(schemaPath: string, data: any): Promise<void> {
    const schemaFile = await fs.readFile(path.resolve(schemaPath), 'utf8');
    const schema = JSON.parse(schemaFile) as Schema;
    this.assertValid(schema, data);
  }

  /**
   * Validates a JSON schema against a given data.
   *
   * @param schema - The schema to validate against.
   * @param data - The data to validate.
   *
   * @throws A {@link SchemaValidationError} if the data is not valid.
   */
  assertValid(schema: Schema, data: any): void {
    const ajv = this.createAjv();
    if (!ajv.validate(schema, data)) {
      debug('Schema validation failed', { errors: ajv.errors });
      throw new SchemaValidationError(ajv);
    }
  }

  private createAjv(): Ajv {
    const ajv = addFormats(
      new Ajv2019({
        allErrors: true,
        verbose: true,
        ...this.extraOpts
      })
    );

    ajv.addMetaSchema(draft7MetaSchema);

    return ajv;
  }
}

type CustomFormats = {
  [Name in string]?: Format;
};

const CosmWasmFormatsDefinition: CustomFormats = {
  uint8: { type: 'number', validate: validateUInt8 },
  uint16: { type: 'number', validate: validateUInt16 },
  uint32: { type: 'number', validate: validateUInt32 },
  uint64: { type: 'number', validate: validateUInt64 },
  int8: { type: 'number', validate: validateInt8 },
  int16: { type: 'number', validate: validateInt16 },
  int32: { type: 'number', validate: validateInt32 },
  int64: { type: 'number', validate: validateInt64 },
};

/* eslint-disable no-mixed-operators */
const ZERO = 0;
const MAX_UINT8 = 2 ** 8 - 1;
const MAX_UINT16 = 2 ** 16 - 1;
const MAX_UINT32 = 2 ** 32 - 1;
const MAX_UINT64 = BigInt(2) ** BigInt(64) - BigInt(1);
const MAX_INT8 = 2 ** 7 - 1;
const MAX_INT16 = 2 ** 15 - 1;
const MAX_INT32 = 2 ** 31 - 1;
const MAX_INT64 = BigInt(2) ** BigInt(63) - BigInt(1);
/* eslint-enable no-mixed-operators */

function validateUInt8(value: number): boolean {
  return Number.isInteger(value) && value >= ZERO && value <= MAX_UINT8;
}

function validateUInt16(value: number): boolean {
  return Number.isInteger(value) && value >= ZERO && value <= MAX_UINT16;
}

function validateUInt32(value: number): boolean {
  return Number.isInteger(value) && value >= ZERO && value <= MAX_UINT32;
}

function validateUInt64(value: number): boolean {
  return Number.isInteger(value) && value >= ZERO && BigInt(value) <= MAX_UINT64;
}

function validateInt8(value: number): boolean {
  return Number.isInteger(value) && value >= -MAX_INT8 && value <= MAX_INT8;
}

function validateInt16(value: number): boolean {
  return Number.isInteger(value) && value >= -MAX_INT16 && value <= MAX_INT16;
}

function validateInt32(value: number): boolean {
  return Number.isInteger(value) && value >= -MAX_INT32 && value <= MAX_INT32;
}

function validateInt64(value: number): boolean {
  return Number.isInteger(value) && BigInt(value) >= -MAX_INT64 && BigInt(value) <= MAX_INT64;
}
