import {
  isAsyncIterable,
  isIterable,
  isPrimitiveValue,
  isPromiseLike,
} from "@http/token-stream/guards";
import { escape, isSafe } from "@http/html-stream/token";
import type { HtmlNode } from "@http/html-stream/types";

export function* streamFragment(children: HtmlNode): Iterable<HtmlNode> {
  if (isSafe(children)) {
    yield children;
  } else if (isPrimitiveValue(children)) {
    yield escape(children);
  } else if (isPromiseLike(children)) {
    yield children.then(streamFragment);
  } else if (isIterable(children)) {
    for (const child of children) {
      yield* streamFragment(child);
    }
  } else if (isAsyncIterable(children)) {
    yield (async function* map(iterable) {
      for await (const node of iterable) {
        yield streamFragment(node);
      }
    })(children);
  }
}
