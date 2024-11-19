import { isTag } from "../token.ts";
import type {
  Context,
  HtmlToken,
  Tag,
  TagAdvice,
  TagAdviceName,
  TagHook,
  TagName,
  TagPattern,
} from "../types.ts";
import { flattenTokens } from "@http/token-stream/flatten-tokens";
import type { AsyncTransformer } from "@http/token-stream/types";

const ADVICE_NAMES: TagAdviceName[] = [
  "beforeBegin",
  "afterBegin",
  "beforeEnd",
  "afterEnd",
];

/**
 * A transformer that allows 'advice' functions to be called before/after tag tokens.
 */
export function tagHooks(
  ...hooks: TagHook[]
): AsyncTransformer<HtmlToken> {
  const collectTokens = new Set<TagPattern>();

  const allAdvices: Partial<
    Record<TagAdviceName, Record<TagPattern, TagAdvice[]>>
  > = {};

  for (const hook of hooks) {
    if (hook.collectTokens && (hook.beforeEnd || hook.afterEnd)) {
      collectTokens.add(hook.tag);
    }
    for (const adviceName of ADVICE_NAMES) {
      if (typeof hook[adviceName] === "function") {
        allAdvices[adviceName] ??= {};
        allAdvices[adviceName][hook.tag] ??= [];
        allAdvices[adviceName][hook.tag]!.push(hook[adviceName]);
      }
    }
  }

  return async function* (tokens) {
    // Opening tags are pushed onto this stack when encountered
    // They are popped off when the matching closing tag is encountered
    // Void elements are never pushed onto the stack
    const tagStack: [Tag, HtmlToken[]][] = [];

    // Mutable context that may be used by hooks to record stuff
    const context: Context = {
      scripts: new Set(),
      stylesheets: new Set(),
      stack: [],
    };

    for await (const token of tokens) {
      if (isTag(token, "open")) {
        tagStack.unshift([token, []]);

        stashTokens(token);

        context.stack.push(token);
        context.tokens = undefined;

        yield* applyTagAdvice("beforeBegin", token);
        yield token;
        yield* applyTagAdvice("afterBegin", token);
      } else if (isTag(token, "void")) {
        stashTokens(token);

        context.stack.push(token);
        context.tokens = undefined;

        yield* applyTagAdvice("beforeBegin", token);
        yield token;
        yield* applyTagAdvice("afterEnd", token);

        context.stack.pop();
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

          context.tokens = tokens;

          yield* applyTagAdvice("beforeEnd", tag);
          yield token;
          yield* applyTagAdvice("afterEnd", tag);

          tagStack.shift();
          context.stack.pop();
        }
      } else {
        stashTokens(token);
        yield token;
      }
    }

    async function* applyTagAdvice(
      adviceName: TagAdviceName,
      tag: Tag,
    ): AsyncIterable<HtmlToken> {
      const advices = allAdvices[adviceName];
      if (advices) {
        for (const pattern of tagPatterns(tag.tagName)) {
          if (pattern && advices[pattern]) {
            for (const advice of advices[pattern]) {
              const node = advice(tag, context);
              if (node) {
                yield* flattenTokens(node);
              }
            }
          }
        }
      }
    }

    function stashTokens(token: HtmlToken) {
      for (const [tag, tokens] of tagStack) {
        if (
          tagPatterns(tag.tagName).some((pattern) => collectTokens.has(pattern))
        ) {
          tokens?.push(token);
        }
      }
    }
  };
}

const tagPatternCache = new Map<TagName, TagPattern[]>();

function tagPatterns(tagName: TagName): TagPattern[] {
  let patterns = tagPatternCache.get(tagName);
  if (!patterns) {
    patterns = [
      tagName,
      ...tagName.split("-").map((_v, i, a) => [...a.slice(0, i), "*"].join("-"))
        .reverse(),
    ];
    tagPatternCache.set(tagName, patterns);
  }
  return patterns;
}
