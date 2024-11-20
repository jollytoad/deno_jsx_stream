import type { AsyncTransformer } from "../types.ts";

/**
 * Filter safe tokens using a given function, and warn if a raw string or unknown/safe token is encountered
 */
export function safetyFilter<T>(
  isSafe: (token: unknown) => token is T,
): AsyncTransformer<T> {
  return async function* (tokens) {
    for await (const token of tokens) {
      if (isSafe(token)) {
        yield token;
      } else if (typeof token === "string") {
        console.warn("%cWARNING: raw string detected:", "color: red", token);
      } else {
        console.warn("%cWARNING: unknown token:", "color: red", token);
      }
    }
  };
}
