import type { AsyncTransformer } from "../types.ts";

/**
 * Encode string tokens into byte arrays.
 */
export function asEncoded<T>(): AsyncTransformer<T, Uint8Array> {
  const encoder = new TextEncoder();
  return async function* (tokens) {
    for await (const token of tokens) {
      yield encoder.encode(token as string);
    }
  };
}
