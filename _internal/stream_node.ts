import { isDeferred, renderPlaceholder, renderSubstitution } from "./defer.ts";
import { isAsyncIterable, isIterable, isPromiseLike } from "../guards.ts";
import { isSafe } from "./safe_string.ts";
import { _deferredPlaceholder, _streamDelay } from "../config.ts";
import { delay } from "https://deno.land/std@0.192.0/async/delay.ts";
import { MuxAsyncIterator } from "https://deno.land/std@0.192.0/async/mux_async_iterator.ts";
import type { DeferredNode, Promisable, StreamableNode } from "../types.ts";

export async function* streamNode(
  node: Promisable<StreamableNode>,
): AsyncIterable<string> {
  const deferrals = new MuxAsyncIterator<AsyncIterable<string>>();

  yield* streamNode_(node);

  for await (const deferredStream of deferrals) {
    yield* deferredStream;
  }

  async function* streamNode_(
    node: Promisable<StreamableNode>,
  ): AsyncIterable<string> {
    if (isDeferred(node)) {
      deferrals.add(renderDeferred(node));
      yield renderPlaceholder(node.id);
    } else if (isSafe(node)) {
      yield String(node);
    } else if (typeof node === "string") {
      yield node;
    } else if (isPromiseLike(node)) {
      yield* streamNode_(await node);
    } else if (isIterable(node)) {
      for (const child of node) {
        yield* streamNode_(child);
      }
    } else if (isAsyncIterable(node)) {
      for await (const child of node) {
        yield* streamNode_(child);
      }
    }

    if (_streamDelay) {
      await delay(_streamDelay);
    }
  }

  async function* renderDeferred(
    deferred: DeferredNode,
  ): AsyncIterable<AsyncIterable<string>> {
    const children = await deferred.children;
    yield renderSubstitution(deferred.id, streamNode_(children));
  }
}
