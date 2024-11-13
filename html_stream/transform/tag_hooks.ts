import { isTag } from "../token.ts";
import type {
  Context,
  HtmlToken,
  Placement,
  Tag,
  TagHandlers,
} from "../types.ts";
import { flattenTokens } from "@http/token-stream/flatten-tokens";
import type { AsyncTransformer } from "@http/token-stream/types";

export function tagHooks(
  tagHandlers?: TagHandlers,
): AsyncTransformer<HtmlToken> {
  return async function* (tokens) {
    // Opening tags are pushed onto this stack when encountered
    // They are popped off when the matching closing tag is encountered
    // Void elements are never pushed onto the stack
    const tagStack: [Tag, HtmlToken[]][] = [];

    // Mutable context that may be used by hooks to record stuff
    const context: Context = {
      scripts: new Set(),
      stylesheets: new Set(),
    };

    for await (const token of tokens) {
      if (isTag(token, "open")) {
        tagStack.unshift([token, []]);

        stashTokens(token);

        yield* applyTagHooks("beforeStart", token);
        yield token;
        yield* applyTagHooks("afterStart", token);
      } else if (isTag(token, "void")) {
        stashTokens(token);

        yield* applyTagHooks("beforeStart", token);
        yield token;
        yield* applyTagHooks("afterEnd", token);
      } else if (isTag(token, "close")) {
        stashTokens(token);

        if (!tagStack.length) {
          console.error(
            `%cTag mismatch, closing tag </${token.tagName}> has no opening tag.`,
            "color: red",
          );
        } else {
          const [[tag, tokens]] = tagStack as [[Tag, HtmlToken[]]];

          if (tag.tagName !== token.tagName) {
            console.error(
              `%cTag mismatch, closing tag </${token.tagName}> does not match expected opening tag <${tag.tagName}>`,
              "color: red",
            );
          }

          yield* applyTagHooks("beforeEnd", tag, tokens);
          yield token;
          yield* applyTagHooks("afterEnd", tag, tokens);

          tagStack.shift();
        }
      } else {
        stashTokens(token);
        yield token;
      }
    }

    async function* applyTagHooks(
      place: Placement,
      tag: Tag,
      tokens?: HtmlToken[],
    ): AsyncIterable<HtmlToken> {
      const wildcards = tag.tagName.split("-").map((_v, i, a) =>
        [...a.slice(0, i), "*"].join("-")
      ).reverse();

      for (const name of [tag.tagName, ...wildcards]) {
        if (name) {
          const fn = asFunction(tagHandlers?.[name]?.[place]);
          const node = fn?.(tag, context, tokens);
          if (node) {
            yield* flattenTokens(node);
          }
        }
      }
    }

    function stashTokens(token: HtmlToken) {
      for (const [tag, tokens] of tagStack) {
        const tagHooks = tagHandlers?.[tag.tagName];
        if (
          tagHooks?.collectTokens && (tagHooks?.beforeEnd || tagHooks?.afterEnd)
        ) {
          tokens?.push(token);
        }
      }
    }
  };
}

function asFunction<F>(fn: F | undefined): F | undefined {
  return typeof fn === "function" ? fn : undefined;
}
