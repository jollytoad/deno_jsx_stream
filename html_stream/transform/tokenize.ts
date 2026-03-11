import type { AsyncTransformer } from "@http/token-stream/types";
import {
  closeTag,
  docType,
  isChunk,
  openTag,
  safe,
  voidTag,
} from "../token.ts";
import type { AttrName, Attrs, AttrValue, HtmlToken } from "../types.ts";
import { isValidAttr, isValidTag, isVoidElement } from "@http/html-stream/util";

/**
 * Options to change the tokenizer behaviour.
 */
export interface TokenizeOptions {
  /**
   * Expand self-closing tags to open & close.
   * `<div/>` -> `<div></div>`
   */
  selfClosing?: boolean;
  /**
   * By default the tokenizer will return invalid chunks as safe tokens,
   * and drop invalid attributes.
   * Setting this will throw an error instead.
   */
  throwErrors?: boolean;
}

/**
 * Tokenize chunks of html embedded within safe token into tag tokens.
 *
 * NOTE: This is a very simplified tokenization expecting well-formed html,
 * it does not validate or attempt to handle the many edge cases of a true
 * html parser. It should only be used on trusted content.
 */
export function tokenize(
  options?: TokenizeOptions,
): AsyncTransformer<HtmlToken | string, HtmlToken> {
  return async function* (tokens) {
    let buffer = "";

    for await (const token of tokens) {
      yield* start(token);
    }

    yield* flush();

    function* start(token: HtmlToken): Iterable<HtmlToken> {
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
        yield* parseTag(consume(gtIndex + 1));

        // continue with buffer
        yield* tokenizeBuffer();
      }
    }

    function consume(index?: number): string {
      const [left, right] = index === undefined
        ? [buffer, ""]
        : [buffer.slice(0, index), buffer.slice(index)];
      buffer = right;
      return left;
    }

    function* parseTag(tag: string): Iterable<HtmlToken> {
      if (tag[1] === "!") {
        const m = /^\<\!DOCTYPE\s+([^\>]*)\>$/.exec(tag);
        if (m) {
          yield docType(m[1]);
        } else if (options?.throwErrors) {
          throw new Error(`Invalid tag: ${tag}`);
        } else {
          yield safe(tag);
        }
        return;
      }

      const m = /^\<\/?([^\s\/\>]+)(\s+.*)?\/?\>$/.exec(tag);
      const tagName = m?.[1]?.toLowerCase();
      const attrStr = m?.[2]?.trim();

      if (!m && options?.throwErrors) {
        throw new Error(`Invalid tag: ${tag}`);
      }

      if (!tagName || !isValidTag(tagName)) {
        if (options?.throwErrors) {
          throw new Error(`Invalid tag name: ${tagName}`);
        }
        yield safe(tag);
        return;
      }

      if (tag[1] === "/") {
        yield closeTag(tagName);
        return;
      }

      let attrs: Attrs | undefined;

      if (attrStr) {
        for (const [name, value] of parseAttributes(attrStr)) {
          if (isValidAttr(name, value)) {
            attrs ??= {};
            attrs[name] = value;
          } else if (options?.throwErrors) {
            throw new Error(
              `Invalid attribute: ${name}=${JSON.stringify(value)}`,
            );
          }
        }
      }

      if (isVoidElement(tagName)) {
        yield voidTag(tagName, attrs);
        return;
      }

      yield openTag(tagName, attrs);

      if (options?.selfClosing && tag.endsWith("/>")) {
        yield closeTag(tagName);
      }
    }

    function* parseAttributes(
      attrStr: string,
    ): Iterable<[AttrName, AttrValue]> {
      while (attrStr.length > 0) {
        const m = attrStr.match(/^([^\s=\/]+)(=)?/);
        const attrName = m?.[1];
        const hasEquals = !!m?.[2];

        if (!m && options?.throwErrors) {
          throw new Error(`Invalid attributes: ${attrStr}`);
        }

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
          } else if (options?.throwErrors) {
            throw new Error(`Invalid attribute: ${m[0]}`);
          }

          attrStr = "";
        } else {
          yield [attrName, true];
          attrStr = attrStr.slice(m[0].length);
        }
      }
    }
  };
}
