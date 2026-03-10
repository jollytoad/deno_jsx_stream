import type { AsyncTransformer } from "@http/token-stream/types";
import { closeTag, isChunk, openTag, safe, voidTag } from "../token.ts";
import type { AttrName, AttrValue, HtmlToken } from "../types.ts";
import { isValidTag, isVoidElement } from "@http/html-stream/util";

// DISCLAIMER: this is mostly AI generated slop, I don't like it, but it works,
// I'd like to tidy it up when I get time.

/**
 * Expand chunks of html embedded within safe token into tag tokens.
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

const State = {
  INITIAL: 0,
  INCOMPLETE_TAG: 1,
} as const;

type State = typeof State[keyof typeof State];

function createTokenizer() {
  let state: State = State.INITIAL;
  let buffer = "";

  function* process(token: HtmlToken): Iterable<HtmlToken> {
    if (isChunk(token)) {
      switch (state) {
        case State.INITIAL:
          yield* stateInitial(token);
          break;
        case State.INCOMPLETE_TAG:
          yield* stateIncompleteTag(token);
          break;
      }
    } else {
      yield* flush();
      yield token;
    }
  }

  function* stateInitial(token: HtmlToken) {
    const ltIndex = token.indexOf("<");
    if (ltIndex >= 0) {
      if (token.includes(">", ltIndex)) {
        yield* tokenizeChunk(token);
      } else {
        state = State.INCOMPLETE_TAG;
        buffer = token;
      }
    } else {
      yield* tokenizeChunk(token);
    }
  }

  function* stateIncompleteTag(token: HtmlToken) {
    buffer += token;

    const gtIndex = buffer.indexOf(">");
    if (gtIndex >= 0) {
      const tagPart = buffer.slice(0, gtIndex + 1);
      const remainder = buffer.slice(gtIndex + 1);

      const tagContent = tagPart.slice(1, -1);
      const tag = parseTag(tagContent);

      if (tag) {
        yield tag;
      } else {
        yield safe(tagPart);
      }

      if (remainder.includes("<") && !remainder.includes(">")) {
        state = State.INCOMPLETE_TAG;
      } else if (remainder.includes("<")) {
        yield* tokenizeChunk(remainder);
        state = State.INITIAL;
        buffer = "";
      } else {
        if (remainder) {
          yield safe(remainder);
        }
        state = State.INITIAL;
        buffer = "";
      }
    }
  }

  function* flush(): Iterable<HtmlToken> {
    if (buffer) {
      yield safe(buffer);
      buffer = "";
      state = State.INITIAL;
    }
  }

  function* tokenizeChunk(chunk: HtmlToken): Iterable<HtmlToken> {
    let i = 0;

    while (i < chunk.length) {
      const ltIndex = chunk.indexOf("<", i);
      if (ltIndex === -1) {
        if (i < chunk.length) {
          yield safe(chunk.slice(i));
        }
        break;
      }

      if (ltIndex > i) {
        yield safe(chunk.slice(i, ltIndex));
      }

      const closeIndex = chunk.indexOf(">", ltIndex);
      if (closeIndex === -1) {
        yield safe(chunk.slice(ltIndex));
        break;
      }

      const tagContent = chunk.slice(ltIndex + 1, closeIndex);
      const tag = parseTag(tagContent);
      if (tag) {
        yield tag;
      } else {
        yield safe(chunk.slice(ltIndex, closeIndex + 1));
      }

      i = closeIndex + 1;
    }
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
      attrsStr = tagContent.slice(spaceIndex + 1).trim();
    }

    if (!isValidTag(tagName)) {
      return null;
    }

    if (isClose) {
      return closeTag(tagName);
    }

    const attributes = attrsStr
      ? Object.fromEntries(parseAttributes(attrsStr))
      : undefined;

    if (isVoid || isVoidElement(tagName)) {
      return voidTag(tagName, attributes);
    }

    return openTag(tagName, attributes);
  }

  function* parseAttributes(attrsStr: string): Iterable<[AttrName, AttrValue]> {
    while (attrsStr.length > 0) {
      const match = attrsStr.match(/^([a-zA-Z_:][a-zA-Z0-9_:\-\.]*)(?:\s*=)?/);
      if (!match?.[1]) {
        break;
      }

      const attrName = match[1];
      let attrValue: AttrValue = true;
      const prevRemaining = attrsStr;

      const afterName = attrsStr.slice(match[0].length).trimStart();

      const quote = afterName[0];
      if (quote === '"' || quote === "'") {
        const endQuote = afterName.indexOf(quote, 1);
        if (endQuote === -1) {
          attrValue = afterName.slice(1);
          attrsStr = "";
        } else {
          attrValue = afterName.slice(1, endQuote);
          attrsStr = afterName.slice(endQuote + 1).trimStart();
        }
      } else if (afterName.length > 0) {
        const valueMatch = afterName.match(/^[a-zA-Z0-9_\-\.]+/);
        if (valueMatch) {
          attrValue = valueMatch[0];
          attrsStr = afterName.slice(valueMatch[0].length).trimStart();
        } else {
          attrsStr = "";
        }
      } else {
        attrsStr = "";
      }

      if (attrName) {
        yield [attrName, attrValue];
      }

      if (attrsStr === prevRemaining || attrsStr.length === 0) {
        break;
      }
    }
  }

  return { process, flush };
}
