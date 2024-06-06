import { isAsyncIterable, isIterable, isPromiseLike } from "../guards.ts";
import { isSafe, isTag } from "./token.ts";
import type {
  Context,
  Node,
  Placement,
  RenderOptions,
  SyncNode,
  Tag,
  Token,
} from "../types.ts";

type AwaitedNode = SyncNode | AsyncIterable<Node>;

/**
 * streamNode for use client-side in ServiceWorker, where deferred
 * rendering behaviour is not desirable and just wastes space.
 */
export async function* streamNode(
  node: Node,
  options?: RenderOptions,
): AsyncIterable<string> {
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

  async function* streamNode_(
    node: Node,
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
        const [[tag, tokens]] = tagStack as [[Tag, Token[]]];

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
    } else if (isPromiseLike<AwaitedNode>(node)) {
      yield* streamNode_(await node);
    } else if (isIterable<Node>(node)) {
      for (const child of node) {
        yield* streamNode_(child);
      }
    } else if (isAsyncIterable<Node>(node)) {
      for await (const child of node) {
        yield* streamNode_(child);
      }
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
}

function asFunction<F>(fn: F | undefined): F | undefined {
  return typeof fn === "function" ? fn : undefined;
}
