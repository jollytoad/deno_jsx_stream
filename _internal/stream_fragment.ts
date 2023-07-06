import {
  isAsyncIterable,
  isIterable,
  isPrimitiveValue,
  isPromiseLike,
} from "../guards.ts";
import { escape, isSafe } from "./token.ts";
import type { Node } from "../types.ts";

export function* streamFragment(children: Node): Iterable<Node> {
  if (isSafe(children)) {
    yield children;
  } else if (isPrimitiveValue(children)) {
    yield escape(children);
  } else if (isPromiseLike<Node>(children)) {
    yield children.then(streamFragment);
  } else if (isIterable<Node>(children)) {
    for (const child of children) {
      yield* streamFragment(child);
    }
  } else if (isAsyncIterable<Node>(children)) {
    yield (async function* map(iterable: AsyncIterable<Node>) {
      for await (const node of iterable) {
        yield streamFragment(node);
      }
    })(children);
  }
}
