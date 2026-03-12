/**
 * Functions for creating safe tokens, HTML escaping, and tag tokens.
 * @module
 */

import { escape as escape_ } from "@std/html/entities";
import { isValidAttr } from "./util.ts";
import type {
  AttrName,
  Attrs,
  AttrValue,
  HtmlToken,
  Tag,
  TagKind,
  TagName,
} from "./types.ts";

/**
 * A string that is deemed safe for rendering,
 * and may contain additional metadata.
 */
class _Token extends String implements Partial<Tag> {
  kind?: TagKind;
  tagName?: TagName;
  attributes?: Attrs;
}

/**
 * Anoint a token as trusted HTML, safe for rendering.
 */
export function safe(value: unknown): string {
  return new _Token(value) as string;
}

/**
 * Escape HTML entities and marks the result as safe for rendering.
 */
export function escape(value: unknown): string {
  return safe(escape_(String(value)));
}

/**
 * Create a `<!DOCTYPE>` declaration token.
 *
 * @param type The document type. Defaults to "html".
 */
export function docType(
  type: string = "html",
): string {
  const token = new _Token(`<!DOCTYPE ${type}>`);
  token.tagName = "!DOCTYPE";
  token.attributes = { type };
  return token as string;
}

/**
 * Create an opening tag token.
 *
 * @param tagName The name of the tag.
 * @param attrs Attributes for the tag.
 */
export function openTag(
  tagName: TagName,
  attrs?: Attrs,
): string {
  return _tag(tagName, attrs, "open");
}

/**
 * Create a void (self-closing) tag token.
 *
 * @param tagName The name of the tag.
 * @param attrs Attributes for the tag.
 */
export function voidTag(
  tagName: TagName,
  attrs?: Attrs,
): string {
  return _tag(tagName, attrs, "void", "/");
}

/**
 * Create a closing tag token.
 *
 * @param tagName The name of the tag.
 */
export function closeTag(tagName: TagName): string {
  const token = new _Token(`</${tagName}>`);
  token.kind = "close";
  token.tagName = tagName;
  return token as string;
}

/**
 * Create an attribute string from a name and value.
 */
export function attr(name: AttrName, value: AttrValue): string {
  const token = new _Token(_attr([name, value]));
  token.attributes = { [name]: value };
  return token as string;
}

/**
 * Type guard to check if a value is a safe token.
 */
export function isSafe(value: unknown): value is HtmlToken {
  return value instanceof _Token;
}

/**
 * Type guard to check if a value is a chunk of HTML (not a tag).
 */
export function isChunk(value: unknown): value is HtmlToken {
  return value instanceof _Token && !value.kind && !value.tagName;
}

/**
 * Type guard to check if a value is a tag.
 *
 * @param kind Optional tag kind to filter by.
 */
export function isTag(value: unknown, kind?: TagKind): value is Tag {
  return value instanceof _Token && !!value.kind && !!value.tagName &&
    (kind ? value.kind === kind : true);
}

function _tag(
  tagName: string,
  attributes: Attrs | undefined,
  kind: TagKind,
  close: "/" | "" = "",
): string {
  const attrStr = _attrs(attributes);
  const token = new _Token(
    `<${tagName}${attrStr ? " " : ""}${attrStr}${close}>`,
  );
  token.kind = kind;
  token.tagName = tagName;
  token.attributes = attributes;
  return token as string;
}

function _attrs(attrs?: Attrs) {
  return attrs ? Object.entries(attrs).map(_attr).join(" ") : "";
}

function _attr([name, value]: [AttrName, AttrValue]): string {
  if (isValidAttr(name, value)) {
    return name + (value === true ? "" : `="${escape(String(value))}"`);
  } else {
    return "";
  }
}
