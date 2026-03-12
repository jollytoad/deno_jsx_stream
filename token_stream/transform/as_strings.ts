import type { AsyncTransformer } from "../types.ts";

/**
 * Coerce tokens into strings
 */
export function asStrings<T>(): AsyncTransformer<T, string> {
  return async function* (tokens) {
    for await (const token of tokens) {
      yield String(token);
    }
  };
}
