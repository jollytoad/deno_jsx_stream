import { defaultPlaceholder, defaultSubstitution } from "./defer.ts";
import { isAsyncIterable, isIterable, isPromiseLike } from "../guards.ts";
import { isSafe, isTag } from "./token.ts";
import { delay } from "https://deno.land/std@0.193.0/async/delay.ts";
import { MuxAsyncIterator } from "https://deno.land/std@0.193.0/async/mux_async_iterator.ts";
import type {
  Context,
  Node,
  Placement,
  Promisable,
  RenderOptions,
  SyncNode,
  Tag,
  Token,
} from "../types.ts";

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

  // Opening tags are pushed onto this stack when encountered
  // They are popped off when the matching closing tag is encountered
  // Void elements are never pushed onto the stack
  const tagStack: [Tag, Token[]][] = [];

  // Mutable context that may be used by hooks to record stuff
  const context: Context = {
    scripts: new Set(),
    stylesheets: new Set(),
  };

  yield* streamNode_(node);

  for await (const deferredStream of deferrals) {
    yield* deferredStream;
  }

  async function* streamNode_(
    node: Node | Promisable<NodeIteration>,
  ): AsyncIterable<string> {
    if (isTag(node, "open")) {
      tagStack.unshift([node, []]);

      stashTokens(node);

      yield* applyTagHooks("beforeStart", node);
      yield String(node);
      yield* applyTagHooks("afterStart", node);
    } else if (isTag(node, "void")) {
      stashTokens(node);

      yield* applyTagHooks("beforeStart", node);
      yield String(node);
      yield* applyTagHooks("afterEnd", node);
    } else if (isTag(node, "close")) {
      stashTokens(node);

      if (!tagStack.length) {
        console.error(
          `%cTag mismatch, closing tag </${node.tagName}> has no opening tag.`,
          "color: red",
        );
      } else {
        const [[tag, tokens]] = tagStack;

        if (tag.tagName !== node.tagName) {
          console.error(
            `%cTag mismatch, closing tag </${node.tagName}> does not match expected opening tag <${tag.tagName}>`,
            "color: red",
          );
        }

        yield* applyTagHooks("beforeEnd", tag, tokens);
        yield String(node);
        yield* applyTagHooks("afterEnd", tag, tokens);

        tagStack.shift();
      }
    } else if (isSafe(node)) {
      stashTokens(node);
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

  async function* applyTagHooks(
    place: Placement,
    tag: Tag,
    tokens?: Token[],
  ) {
    const wildcards = tag.tagName.split("-").map((_v, i, a) =>
      [...a.slice(0, i), "*"].join("-")
    ).reverse();

    for (const name of [tag.tagName, ...wildcards]) {
      if (name) {
        const fn = asFunction(options?.tagHandlers?.[name]?.[place]);
        const node = fn?.(tag, context, tokens);
        if (node) {
          yield* streamNode_(node);
        }
      }
    }
  }

  function stashTokens(token: Token) {
    for (const [tag, tokens] of tagStack) {
      const tagHooks = options?.tagHandlers?.[tag.tagName];
      if (
        tagHooks?.collectTokens && (tagHooks?.beforeEnd || tagHooks?.afterEnd)
      ) {
        tokens?.push(token);
      }
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
