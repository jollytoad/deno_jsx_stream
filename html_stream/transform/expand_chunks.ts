import type { AsyncTransformer } from "@http/token-stream/types";
import { closeTag, isChunk, openTag, safe, voidTag } from "../token.ts";
import type { AttrName, AttrValue, HtmlToken } from "../types.ts";
import { isValidTag, isVoidElement } from "@http/html-stream/util";

/**
 * Expand chunks of html embedded within safe token into tag tokens.
 *
 * NOTE: This is a very simplified tokenization expecting well-formed html,
 * it does not validate or attempt to handle the many edge cases of a true
 * html parser. It should only be used on trusted content.
 */
export function expandChunks(): AsyncTransformer<HtmlToken> {
  return async function* (tokens) {
    const { process, flush } = createTokenizer();

    for await (const token of tokens) {
      yield* process(token);
    }

    yield* flush();
  };
}

function createTokenizer() {
  let buffer = "";

  function* process(token: HtmlToken): Iterable<HtmlToken> {
    if (isChunk(token)) {
      buffer += token;
      yield* tokenizeBuffer();
    } else {
      yield* flush();
      yield token;
    }
  }

  function* flush(): Iterable<HtmlToken> {
    if (buffer) {
      yield safe(consume());
    }
  }

  function* tokenizeBuffer(): Iterable<HtmlToken> {
    if (!buffer.length) return;

    // Search for start of tag
    const ltIndex = buffer.indexOf("<");

    if (ltIndex === -1) {
      // No start of tag, emit whole buffer
      yield safe(consume());
      return;
    }

    if (ltIndex > 0) {
      // Emit chunk before start of tag, and trim from buffer
      yield safe(consume(ltIndex));
    }

    // Search for end of tag
    const gtIndex = buffer.indexOf(">");

    if (gtIndex >= 0) {
      // parse tag content, trim buffer
      yield parseTag(consume(gtIndex + 1));

      // continue with buffer
      yield* tokenizeBuffer();
    }
  }

  function consume(index?: number): string {
    const left = index === undefined ? buffer : buffer.slice(0, index);
    buffer = index === undefined ? "" : buffer.slice(index);
    return left;
  }

  function parseTag(tag: string): HtmlToken {
    if (tag[1] === "!") {
      return safe(tag);
    }

    const isClose = tag[1] === "/";
    const isVoid = tag.endsWith("/>");

    const m = /^\<\/?([^\s\/\>]+)(\s+.*)?\/?\>$/.exec(tag);
    const tagName = m?.[1]?.toLowerCase();
    const attrStr = m?.[2]?.trim();

    if (!tagName || !isValidTag(tagName)) return safe(tag);

    if (isClose) {
      return closeTag(tagName);
    }

    const attributes = attrStr
      ? Object.fromEntries(parseAttributes(attrStr))
      : undefined;

    if (isVoid || isVoidElement(tagName)) {
      return voidTag(tagName, attributes);
    }

    return openTag(tagName, attributes);
  }

  function* parseAttributes(attrStr: string): Iterable<[AttrName, AttrValue]> {
    while (attrStr.length > 0) {
      const m = attrStr.match(/^([^\s=\/]+)(=)?/);
      const attrName = m?.[1];
      const hasEquals = !!m?.[2];

      if (!attrName) break;

      if (hasEquals) {
        const quoteIndex = m[0].length;
        const quote = attrStr[quoteIndex];

        if (quote === '"' || quote === "'") {
          const endQuoteIndex = attrStr.indexOf(quote, quoteIndex + 1);
          if (endQuoteIndex >= 0) {
            yield [attrName, attrStr.slice(quoteIndex + 1, endQuoteIndex)];
            attrStr = attrStr.slice(endQuoteIndex + 1).trimStart();
            continue;
          }
        }

        attrStr = "";
      } else {
        yield [attrName, true];
        attrStr = attrStr.slice(m[0].length);
      }
    }
  }

  return { process, flush };
}
