import type { AsyncTransformer } from "../types.ts";

/**
 * Catch errors thrown from within a token stream.
 *
 * If a handler function is supplied it will be called with the error,
 * and may return a new stream of tokens, or it may just rethrow the error.
 *
 * If a handler is not supplied, then the error is logged, and rethrown.
 *
 * There seems to be a bug in Deno that silently discards unhandled errors
 * within streams passed to a Response, so it's recommended that this
 * transform is used even without a handler fn, to ensure that no errors go
 * unreported. See: https://github.com/denoland/deno/issues/19867
 *
 * @param handler called with the error and may return a new stream of tokens or throw
 */
export function catchErrors<T>(
  handler?: (error: unknown) => AsyncIterable<T>,
): AsyncTransformer<T> {
  return async function* (tokens) {
    try {
      for await (const token of tokens) {
        yield token;
      }
    } catch (error: unknown) {
      if (handler) {
        yield* handler(error);
      } else {
        console.error(error);
        throw error;
      }
    }
  };
}
