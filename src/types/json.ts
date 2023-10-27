export type JsonValue =
  | JsonArray
  | JsonObject
  | boolean
  | number
  | string;

export interface JsonObject {
  [x: string]: JsonValue;
}

export interface JsonArray extends Array<JsonValue> { }
