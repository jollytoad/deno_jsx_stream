import type { AsyncTransformer } from "../types.ts";

export function asStrings<T>(): AsyncTransformer<T, string> {
  return async function* (tokens) {
    for await (const token of tokens) {
      yield String(token);
    }
  };
}
