import type { AsyncTransformer } from "../types.ts";

export type TokenLogger = (token: unknown) => void;

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

export function defaultLogger(token: unknown): void {
  console.debug(token);
}
