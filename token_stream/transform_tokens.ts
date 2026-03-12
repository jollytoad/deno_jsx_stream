import type { AsyncTransformer } from "./types.ts";

/**
 * Composes multiple token stream transformers into a single transformer.
 *
 * @param transformers The transformer functions to compose
 * @returns A composed transformer that applies all transformers in sequence
 *
 * @example
 * ```ts
 * import { transformTokens } from "@http/token-stream/transform-tokens";
 * import { asStrings } from "@http/token-stream/transform/as-strings";
 * import { asEncoded } from "@http/token-stream/transform/as-encoded";
 * import { catchErrors } from "@http/token-stream/transform/catch-errors";
 *
 * const transformer = transformTokens([
 *   asStrings(),
 *   asEncoded(),
 *   catchErrrors(),
 * ]);
 */
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
