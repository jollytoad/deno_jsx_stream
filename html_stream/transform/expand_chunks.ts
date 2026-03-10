import type { AsyncTransformer } from "@http/token-stream/types";
import { closeTag, isSafe, isTag, openTag, safe, voidTag } from "../token.ts";
import type { AttrName, HtmlToken } from "../types.ts";

// DISCLAIMER: this is mostly AI generated slop, I don't like it, but it works,
// I'd like to tidy it up when I get time.

/**
 * Expand chunks of html embedded within safe token into tag tokens.
 */
export function expandChunks(): AsyncTransformer<HtmlToken> {
  return async function* (tokens) {
    const tokenizer = createTokenizer();

    for await (const token of tokens) {
      yield* tokenizer.process(token);
    }

    yield* tokenizer.flush();
  };
}

const HTML_VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

type TokenizerState = "NORMAL" | "INCOMPLETE_TAG";

function createTokenizer() {
  let state: TokenizerState = "NORMAL";
  let buffer = "";

  function tokenizeChunk(chunk: string): HtmlToken[] {
    const tokens: HtmlToken[] = [];
    let i = 0;

    while (i < chunk.length) {
      const ltIndex = chunk.indexOf("<", i);
      if (ltIndex === -1) {
        if (i < chunk.length) {
          tokens.push(safe(chunk.slice(i)));
        }
        break;
      }

      if (ltIndex > i) {
        tokens.push(safe(chunk.slice(i, ltIndex)));
      }

      const closeIndex = chunk.indexOf(">", ltIndex);
      if (closeIndex === -1) {
        tokens.push(safe(chunk.slice(ltIndex)));
        break;
      }

      const tagContent = chunk.slice(ltIndex + 1, closeIndex);
      const tag = parseTag(tagContent);
      if (tag) {
        tokens.push(tag);
      } else {
        tokens.push(safe(chunk.slice(ltIndex, closeIndex + 1)));
      }

      i = closeIndex + 1;
    }

    return tokens;
  }

  function parseTag(content: string): HtmlToken | null {
    if (content.startsWith("!")) {
      return null;
    }

    const isClose = content.startsWith("/");
    const afterSlash = isClose ? content.slice(1) : content;
    const isVoid = afterSlash.endsWith("/");
    const tagContent = isVoid ? afterSlash.slice(0, -1).trimEnd() : afterSlash;

    const spaceIndex = tagContent.indexOf(" ");
    let tagName: string;
    let attrsStr: string;

    if (spaceIndex === -1) {
      tagName = tagContent.toLowerCase();
      attrsStr = "";
    } else {
      tagName = tagContent.slice(0, spaceIndex).toLowerCase();
      attrsStr = tagContent.slice(spaceIndex + 1);
    }

    if (!isValidTagName(tagName)) {
      return null;
    }

    const attributes = parseAttributes(attrsStr);

    if (isClose) {
      return closeTag(tagName);
    }

    if (isVoid || HTML_VOID_TAGS.has(tagName)) {
      return voidTag(tagName, attributes);
    }

    return openTag(tagName, attributes);
  }

  function isValidTagName(name: string): boolean {
    if (!name) return false;
    return /^[a-zA-Z][a-zA-Z0-9\-]*$/.test(name);
  }

  function parseAttributes(attrsStr: string): Record<AttrName, unknown> {
    const attributes: Record<string, unknown> = {};
    if (!attrsStr.trim()) return attributes;

    let remaining = attrsStr.trim();
    while (remaining.length > 0) {
      const match = remaining.match(/^([a-zA-Z_:][a-zA-Z0-9_:\-\.]*)(?:\s*=)?/);
      if (!match || !match[1]) {
        break;
      }

      const attrName = match[1];
      let attrValue: unknown = true;
      const prevRemaining = remaining;

      const afterName = remaining.slice(match[0].length).trimStart();

      if (afterName.startsWith('"')) {
        const endQuote = afterName.indexOf('"', 1);
        if (endQuote === -1) {
          attrValue = afterName.slice(1);
          remaining = "";
        } else {
          attrValue = afterName.slice(1, endQuote);
          remaining = afterName.slice(endQuote + 1).trimStart();
        }
      } else if (afterName.startsWith("'")) {
        const endQuote = afterName.indexOf("'", 1);
        if (endQuote === -1) {
          attrValue = afterName.slice(1);
          remaining = "";
        } else {
          attrValue = afterName.slice(1, endQuote);
          remaining = afterName.slice(endQuote + 1).trimStart();
        }
      } else if (afterName.length > 0) {
        const valueMatch = afterName.match(/^[a-zA-Z0-9_\-\.]+/);
        if (valueMatch) {
          attrValue = valueMatch[0];
          remaining = afterName.slice(valueMatch[0].length).trimStart();
        } else {
          remaining = "";
        }
      } else {
        remaining = "";
      }

      if (attrName) {
        attributes[attrName] = attrValue;
      }

      if (remaining === prevRemaining || remaining.length === 0) {
        break;
      }
    }

    return attributes;
  }

  function process(token: HtmlToken): HtmlToken[] {
    const result: HtmlToken[] = [];

    if (isTag(token)) {
      if (buffer) {
        result.push(safe(buffer));
        buffer = "";
        state = "NORMAL";
      }
      result.push(token);
      return result;
    }

    if (isSafe(token)) {
      if (state === "NORMAL") {
        const ltIndex = token.indexOf("<");
        if (ltIndex === -1) {
          return tokenizeChunk(token);
        }

        const gtIndex = token.indexOf(">", ltIndex);
        if (gtIndex === -1) {
          state = "INCOMPLETE_TAG";
          buffer = token;
          return [];
        }

        return tokenizeChunk(token);
      }

      buffer += token;

      const gtIndex = buffer.indexOf(">");
      if (gtIndex === -1) {
        return [];
      }

      const tagPart = buffer.slice(0, gtIndex + 1);
      const remainder = buffer.slice(gtIndex + 1);

      const tagContent = tagPart.slice(1, -1);
      const tag = parseTag(tagContent);

      if (tag) {
        result.push(tag);
      } else {
        result.push(safe(tagPart));
      }

      if (remainder.includes("<") && !remainder.includes(">")) {
        state = "INCOMPLETE_TAG";
      } else if (remainder.includes("<")) {
        result.push(...tokenizeChunk(remainder));
        state = "NORMAL";
        buffer = "";
      } else {
        if (remainder) {
          result.push(safe(remainder));
        }
        state = "NORMAL";
        buffer = "";
      }
      return result;
    }

    if (buffer) {
      result.push(safe(buffer));
      buffer = "";
      state = "NORMAL";
    }
    result.push(token);
    return result;
  }

  function flush(): HtmlToken[] {
    const result: HtmlToken[] = [];
    if (buffer) {
      result.push(safe(buffer));
      buffer = "";
      state = "NORMAL";
    }
    return result;
  }

  return { process, flush };
}
