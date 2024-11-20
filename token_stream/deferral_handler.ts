import { MuxAsyncIterator } from "@std/async/mux-async-iterator";
import type {
  DeferralHandler,
  DeferralOptions,
  PlaceholderId,
} from "./types.ts";

/**
 * A default DeferralHandler implementation that races the given promise against a timeout,
 * emitting a placeholder if the timeout is hit, and queuing the eventual promise for
 * later emission.
 */
export function deferralHandler<T>(
  options: DeferralOptions<T>,
): DeferralHandler<T> {
  const deferrals = new MuxAsyncIterator<AsyncIterable<T>>();

  async function timeout<T>(value: PromiseLike<T>) {
    let i;
    try {
      return await Promise.race([
        value,
        new Promise<void>((resolve) => {
          i = setTimeout(resolve, options.timeout);
        }),
      ]);
    } finally {
      clearTimeout(i);
    }
  }

  function defer(deferred: AsyncIterable<T>): T {
    const id = options.generateId?.() ?? crypto.randomUUID();
    deferrals.add(wrapDeferred(id, deferred));
    return options.placeholder(id);
  }

  async function* wrapDeferred(
    id: PlaceholderId,
    deferred: AsyncIterable<T>,
  ): AsyncIterable<AsyncIterable<T>> {
    yield options.substitution(id, deferred);
  }

  async function* iterate() {
    for await (const deferredStream of deferrals) {
      yield* deferredStream;
    }
  }

  return {
    timeout,
    defer,
    [Symbol.asyncIterator]: iterate,
  };
}
