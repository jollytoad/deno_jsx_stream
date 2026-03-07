import {
  isAsyncIterable,
  isIterable,
  isPrimitiveValue,
  isPromiseLike,
} from "@http/token-stream/guards";
import { escape, isSafe } from "./token.ts";
import type { HtmlNode } from "./types.ts";

/**
 * Stream an unknown value as an `Iterable` of {@link HtmlNode}.
 *
 * Ignoring empty values, escaping primitives, passing already
 * safe values, and handling promises/iterables/async-iterables
 * recursively. Any other value is ignored.
 */
export function* streamFragment(value: unknown): Iterable<HtmlNode> {
  if (value === undefined || value === null || value === "") {
    // ignore
  } else if (isSafe(value)) {
    yield value;
  } else if (isPrimitiveValue(value)) {
    yield escape(value);
  } else if (isPromiseLike(value)) {
    yield value.then(streamFragment);
  } else if (isIterable(value)) {
    for (const child of value) {
      yield* streamFragment(child);
    }
  } else if (isAsyncIterable(value)) {
    yield (async function* map(iterable) {
      for await (const node of iterable) {
        yield streamFragment(node);
      }
    })(value);
  }
}
