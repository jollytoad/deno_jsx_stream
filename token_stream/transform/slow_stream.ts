import type { AsyncTransformer } from "../types.ts";

export function slowStream<T>(streamDelay: number): AsyncTransformer<T> {
  return async function* (tokens) {
    for await (const token of tokens) {
      await delay(streamDelay);
      yield token;
    }
  };
}

function delay(time: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, time));
}
