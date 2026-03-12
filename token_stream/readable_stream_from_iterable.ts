/**
 * Creates a ReadableStream from an iterable or async iterable.
 *
 * A polyfill for `ReadableStream.from`, which isn't yet widely available in
 * many runtimes.
 *
 * @example
 * ```ts
 * import { readableStreamFromIterable } from "@http/token-stream/readable-stream-from-iterable";
 *
 * // From sync iterable
 * const stream1 = readableStreamFromIterable([1, 2, 3]);
 *
 * // From async iterable
 * async function* gen() { yield "a"; yield "b"; }
 * const stream2 = readableStreamFromIterable(gen());
 * ```
 */
export function readableStreamFromIterable<T>(
  iterable: Iterable<T> | AsyncIterable<T>,
): ReadableStream<T> {
  if ("from" in ReadableStream && typeof ReadableStream.from === "function") {
    return ReadableStream.from(iterable);
  }

  const iterator: Iterator<T> | AsyncIterator<T> =
    (iterable as AsyncIterable<T>)[Symbol.asyncIterator]?.() ??
      (iterable as Iterable<T>)[Symbol.iterator]?.();

  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
    async cancel(reason) {
      if (typeof iterator.throw == "function") {
        try {
          await iterator.throw(reason);
        } catch { /* `iterator.throw()` always throws on site. We catch it. */ }
      }
    },
  });
}
