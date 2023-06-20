import { delay } from "https://deno.land/std@0.192.0/async/delay.ts";
import { isAsyncIterable, isIterable, isPromiseLike } from "../guards.ts";
import { escape, isSafe } from "./safe_string.ts";
import type { Children, Node, Promisable } from "../types.ts";
import { defer, isDeferred } from "./defer.ts";
import { _deferredTimeout } from "../config.ts";

export async function* streamFragment(children: Children): AsyncIterable<Node> {
  if (isSafe(children) || isDeferred(children)) {
    yield children;
  } else if (
    typeof children === "string" || typeof children === "boolean" ||
    typeof children === "number"
  ) {
    yield escape(children);
  } else if (isPromiseLike(children)) {
    if (_deferredTimeout) {
      const awaited = await Promise.race([
        children,
        delay(_deferredTimeout),
      ]);

      if (awaited) {
        yield* streamFragment(awaited);
      } else {
        yield defer(children as Promisable<Children>);
      }
    } else {
      yield* streamFragment(children);
    }
  } else if (isIterable(children)) {
    for (const child of children) {
      yield* streamFragment(child);
    }
  } else if (isAsyncIterable(children)) {
    // TODO: if the first child takes too long to arrive, defer like we do for PromiseLike above

    for await (const child of children) {
      yield* streamFragment(child);
    }
  }
}
