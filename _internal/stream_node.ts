import { defaultPlaceholder, defaultSubstitution } from "./defer.ts";
import { isAsyncIterable, isIterable, isPromiseLike } from "../guards.ts";
import { isSafe } from "./safe_string.ts";
import { delay } from "https://deno.land/std@0.192.0/async/delay.ts";
import { MuxAsyncIterator } from "https://deno.land/std@0.192.0/async/mux_async_iterator.ts";
import type { Node, Promisable, RenderOptions, SyncNode } from "../types.ts";

type AwaitedNode = SyncNode | AsyncIterable<Node>;
type NodeIteration = IteratorResult<AwaitedNode> & {
  iterator: AsyncIterator<Node>;
};

export async function* streamNode(
  node: Node,
  options?: RenderOptions,
): AsyncIterable<string> {
  const deferredTimeout = asSafeInteger(options?.deferredTimeout);
  const streamDelay = asSafeInteger(options?.streamDelay);
  const renderPlaceholder = asFunction(options?.deferredPlaceholder) ??
    defaultPlaceholder;
  const renderSubstitution = asFunction(options?.deferredSubstitution) ??
    defaultSubstitution;

  // This will accumulate deferred nodes that took longer than the timeout
  // they will be rendered at the end of the stream
  const deferrals = new MuxAsyncIterator<AsyncIterable<string>>();

  yield* streamNode_(node);

  for await (const deferredStream of deferrals) {
    yield* deferredStream;
  }

  async function* streamNode_(
    node: Node | Promisable<NodeIteration>,
  ): AsyncIterable<string> {
    if (isSafe(node)) {
      // convert the safe string to a string
      yield String(node);
    } else if (typeof node === "string") {
      console.warn("%cWARNING: raw string detected:", "color: red", node);
    } else if (isPromiseLike<AwaitedNode | NodeIteration>(node)) {
      const awaited = await timeout(node, deferredTimeout);

      if (awaited) {
        yield* streamNode_(awaited);
      } else {
        yield defer(node);
      }
    } else if (isIterable<Node>(node)) {
      for (const child of node) {
        yield* streamNode_(child);
      }
    } else if (isAsyncIterable<Node>(node)) {
      if (deferredTimeout) {
        yield* streamNode_(firstNodeIteration(node));
      } else {
        for await (const child of node) {
          yield* streamNode_(child);
        }
      }
    } else if (isNodeIteration(node)) {
      if (!node.done) {
        yield* streamNode_(node.value);
        yield* streamNode_(nextNodeIteration(node.iterator));
      }
    }

    if (streamDelay) {
      await delay(streamDelay);
    }
  }

  function defer(node: Promise<AwaitedNode | NodeIteration>) {
    const id = crypto.randomUUID();
    deferrals.add(renderDeferred(id, node));
    return renderPlaceholder(id);
  }

  async function* renderDeferred(
    id: string,
    deferred: Promise<AwaitedNode | NodeIteration>,
  ): AsyncIterable<AsyncIterable<string>> {
    const node = await deferred;
    yield renderSubstitution(id, streamNode_(node));
  }
}

function asSafeInteger(value: unknown): number | undefined {
  return Number.isSafeInteger(value) ? value as number : undefined;
}

function asFunction<F>(fn: F | undefined): F | undefined {
  return typeof fn === "function" ? fn : undefined;
}

function firstNodeIteration(iterable: AsyncIterable<Node>) {
  return nextNodeIteration(iterable[Symbol.asyncIterator]());
}

async function nextNodeIteration(
  iterator: AsyncIterator<Node>,
): Promise<NodeIteration> {
  const result = await iterator.next() as IteratorResult<AwaitedNode>;
  return {
    ...result,
    iterator,
  };
}

function isNodeIteration(node: Node | NodeIteration): node is NodeIteration {
  return typeof (node as NodeIteration)?.iterator?.next === "function";
}

function timeout<T>(
  value: Promise<T>,
  deferredTimeout: number | undefined,
): Promise<T | void> {
  if (deferredTimeout) {
    return Promise.race([
      value,
      delay(deferredTimeout),
    ]);
  } else {
    return value;
  }
}
