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
  // Map of deferred content, the Promise resolves when the AsyncIterable emits it's first value
  const deferrals = new Map<
    PlaceholderId,
    Promise<readonly [PlaceholderId, AsyncIterable<T>]>
  >();

  async function timeout<T>(pending: PromiseLike<T>) {
    let i;
    try {
      return await Promise.race([
        pending,
        new Promise<void>((resolve) => {
          i = setTimeout(resolve, options.timeout);
        }),
      ]);
    } finally {
      clearTimeout(i);
    }
  }

  function defer(pending: AsyncIterable<T>): T {
    const id = options.generateId?.() ?? crypto.randomUUID();
    deferrals.set(id, watch(id, pending));
    return options.placeholder(id);
  }

  async function watch(id: PlaceholderId, pending: AsyncIterable<T>) {
    const iterator = pending[Symbol.asyncIterator]();

    // wait for the first value from the iterator
    const { done, value } = await iterator.next();

    return [
      id,
      (async function* (done, value) {
        if (!done) {
          // yield the first value we just awaited
          yield value;
          // wrap the remaining iterator in an iterable and yield all value
          yield* { [Symbol.asyncIterator]: () => iterator };
        }
      })(done, value) as AsyncIterable<T>,
    ] as const;
  }

  async function* iterate() {
    while (deferrals.size) {
      const [id, deferred] = await Promise.race(deferrals.values());
      deferrals.delete(id);

      if (deferred) {
        // apply the substitution template to the deferred tokens
        yield* options.substitution(id, deferred);
      }
    }
  }

  return {
    timeout,
    defer,
    [Symbol.asyncIterator]: iterate,
  };
}
