import fs from 'node:fs/promises';
import path from 'node:path';

import Ajv, { Format, Schema } from 'ajv';
import addFormats from 'ajv-formats';

type CosmWasmFormats = {
  [Name in string]?: Format;
};

const cosmWasmFormatsDefinition: CosmWasmFormats = {
  uint8: { type: 'number', validate: validateUInt8 },
  uint16: { type: 'number', validate: validateUInt16 },
  uint32: { type: 'number', validate: validateUInt32 },
  uint64: { type: 'number', validate: validateUInt64 },
};

export class SchemaValidationError extends Error {
  constructor(ajv: Ajv) {
    super(ajv.errorsText(ajv.errors));
    this.name = 'SchemaValidationError';
  }
}

export class SchemaValidator {
  /**
   * Validates a JSON schema against a given data.
   *
   * @param schemaPath - Path to the schema file.
   * @param data - The data to validate.
   *
   * @throws A {@link SchemaValidationError} if the data is not valid.
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async assertValidJSONSchema(schemaPath: string, data: any): Promise<void> {
    const schemaFile = await fs.readFile(path.resolve(schemaPath), 'utf-8');
    const schema: Schema = JSON.parse(schemaFile);
    const ajv = addFormats(
      new Ajv({
        allErrors: true,
        verbose: true,
        formats: cosmWasmFormatsDefinition,
      })
    );

    if (!ajv.validate(schema, data)) {
      throw new SchemaValidationError(ajv);
    }
  }
}

/* eslint-disable no-mixed-operators */
const ZERO = 0;
const MAX_UINT8 = 2 ** 8 - 1;
const MAX_UINT16 = 2 ** 16 - 1;
const MAX_UINT32 = 2 ** 32 - 1;
const MAX_UINT64 = BigInt(2) ** BigInt(64) - BigInt(1);
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
