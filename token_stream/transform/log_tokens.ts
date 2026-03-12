import type { AsyncTransformer } from "../types.ts";

export type TokenLogger = (token: unknown) => void;

/**
 * Log each token to the console, passing token thru unchanged
 *
 * @param logger an alternative logging function
 */
export function logTokens<T>(
  logger: TokenLogger = defaultLogger,
): AsyncTransformer<T> {
  return async function* (tokens) {
    for await (const token of tokens) {
      logger(token);
      yield token;
    }
  };
}

/**
 * The default logging function for {@link logTokens}
 */
export function defaultLogger(token: unknown): void {
  console.debug(token);
}
