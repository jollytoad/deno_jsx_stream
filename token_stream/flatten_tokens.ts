import {
  isAsyncIterable,
  isIterable,
  isNodeIteration,
  isPromiseLike,
} from "./guards.ts";
import type {
  Awaitable,
  AwaitedNode,
  DeferralHandler,
  Node,
  NodeIteration,
} from "./types.ts";

/**
 * Flattens a tree of nodes into a stream of tokens.
 *
 * Recursively processes nodes, handling plain values, synchronous iterables,
 * async iterables, and promises.
 *
 * @param node the root node
 * @param deferrals an optional strategy for handling slow-resolving async nodes
 * @returns An async iterable of tokens
 *
 * @example
 * ```ts
 * import { flattenTokens } from "@http/token-stream/flatten-tokens";
 *
 * async function* generateNodes() {
 *   yield "Hello";
 *   yield* [" ", "World"];
 *   yield "!";
 * }
 *
 * for await (const token of flattenTokens(generateNodes())) {
 *   console.log(token); // "Hello", " ", "World", "!"
 * }
 * ```
 */
export async function* flattenTokens<T>(
  node: Node<T>,
  deferrals?: DeferralHandler<T>,
): AsyncIterable<T> {
  yield* flatten_(node);

  if (deferrals) {
    yield* deferrals;
  }

  async function* flatten_(
    node: Node<T> | Awaitable<NodeIteration<T>>,
  ): AsyncIterable<T> {
    if (isPromiseLike<AwaitedNode<T>>(node)) {
      if (deferrals) {
        const awaited = await deferrals.timeout(node);
        if (awaited) {
          yield* flatten_(awaited);
        } else {
          yield deferrals.defer(flattenAwaited(node));
        }
      } else {
        yield* flatten_(await node);
      }
    } else if (isIterable<Node<T>>(node)) {
      for (const child of node) {
        yield* flatten_(child);
      }
    } else if (isAsyncIterable<Node<T>>(node)) {
      if (deferrals) {
        yield* flatten_(firstNodeIteration(node));
      } else {
        for await (const child of node) {
          yield* flatten_(child);
        }
      }
    } else if (isNodeIteration<Node<T>>(node)) {
      if (!node.done) {
        yield* flatten_(node.value);
        yield* flatten_(nextNodeIteration(node.iterator));
      }
    } else {
      yield node as T;
    }
  }

  async function* flattenAwaited(
    node: PromiseLike<AwaitedNode<T>>,
  ): AsyncIterable<T> {
    const awaited = await node;
    yield* flatten_(awaited);
  }

  function firstNodeIteration(iterable: AsyncIterable<Node<T>>) {
    return nextNodeIteration(iterable[Symbol.asyncIterator]());
  }

  async function nextNodeIteration(
    iterator: AsyncIterator<Node<T>>,
  ): Promise<NodeIteration<T>> {
    const result = await iterator.next() as IteratorResult<AwaitedNode<T>>;
    return {
      ...result,
      iterator,
    };
  }
}
