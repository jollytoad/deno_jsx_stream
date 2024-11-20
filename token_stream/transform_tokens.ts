import type { AsyncTransformer } from "./types.ts";

export function transformTokens<T>(
  transformers?: Iterable<AsyncTransformer<T>>,
): AsyncTransformer<T> {
  return (tokens) => {
    if (transformers) {
      for (const transform of transformers) {
        tokens = transform(tokens);
      }
    }
    return tokens;
  };
}
