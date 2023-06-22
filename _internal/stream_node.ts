import { defaultPlaceholder, defaultSubstitution } from "./defer.ts";
import { isAsyncIterable, isIterable, isPromiseLike } from "../guards.ts";
import { isSafe } from "./safe_string.ts";
import { delay } from "https://deno.land/std@0.192.0/async/delay.ts";
import { MuxAsyncIterator } from "https://deno.land/std@0.192.0/async/mux_async_iterator.ts";
import type { Node, Promisable, RenderOptions, SyncNode } from "../types.ts";

type AwaitedNode = SyncNode | AsyncIterable<Node>;

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

  const deferrals = new MuxAsyncIterator<AsyncIterable<string>>();

  yield* streamNode_(node);

  for await (const deferredStream of deferrals) {
    yield* deferredStream;
  }

  async function* streamNode_(
    node: Node | AsyncNext,
  ): AsyncIterable<string> {
    if (isSafe(node)) {
      // convert the safe string to a string
      yield String(node);
    } else if (typeof node === "string") {
      console.warn("%cWARNING: raw string detected:", "color: red", node);
    } else if (isPromiseLike(node as Promisable<AwaitedNode>)) {
      const awaited = await timeout(
        node as Promise<AwaitedNode>,
        deferredTimeout,
      );

      if (awaited) {
        yield* streamNode_(awaited);
      } else {
        yield defer(node as Promise<AwaitedNode>);
      }
    } else if (isIterable<Node>(node)) {
      for (const child of node) {
        yield* streamNode_(child);
      }
    } else if (isAsyncIterable<Node>(node)) {
      if (deferredTimeout) {
        yield* streamNode_(AsyncNext.fromIterable(node));
      } else {
        for await (const child of node) {
          yield* streamNode_(child);
        }
      }
    } else if (node instanceof AsyncNext) {
      const awaited = await timeout(node.node, deferredTimeout);

      if (awaited) {
        if (!awaited.done) {
          yield* streamNode_(awaited.value);
          yield* streamNode_(node.next());
        }
      } else {
        yield defer(node);
      }
    }

    if (streamDelay) {
      await delay(streamDelay);
    }
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

  function defer(node: Promise<AwaitedNode> | AsyncNext) {
    const id = crypto.randomUUID();
    deferrals.add(renderDeferred(id, node));
    return renderPlaceholder(id);
  }

  async function* renderDeferred(
    id: string,
    deferred: Promise<AwaitedNode> | AsyncNext,
  ): AsyncIterable<AsyncIterable<string>> {
    if (deferred instanceof AsyncNext) {
      await deferred.node;
    }
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

class AsyncNext {
  iterator: AsyncIterator<Node>;
  node: Promise<IteratorResult<Node>>;

  constructor(
    iterator: AsyncIterator<Node>,
    node: Promise<IteratorResult<Node>>,
  ) {
    this.iterator = iterator;
    this.node = node;
  }

  static fromIterable(iterable: AsyncIterable<Node>) {
    const iterator = iterable[Symbol.asyncIterator]();
    return new AsyncNext(iterator, iterator.next());
  }

  next(): AsyncNext {
    return new AsyncNext(this.iterator, this.iterator.next());
  }
}
