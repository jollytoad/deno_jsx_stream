import { escape as escape_ } from "@std/html/entities";
import { isValidAttr } from "./util.ts";
import type { AttrName, Tag, TagKind, TagName } from "../types.ts";

/**
 * A string that is deemed safe for rendering,
 * and may contain additional metadata.
 */
class _Token extends String implements Partial<Tag> {
  kind?: TagKind;
  tagName?: TagName;
  attributes?: Record<AttrName, unknown>;
}

export function safe(value: unknown): string {
  return new _Token(value) as string;
}

export function escape(value: unknown): string {
  return safe(escape_(String(value)));
}

export function openTag(
  tagName: TagName,
  attrs: Record<AttrName, unknown>,
): string {
  return _tag(tagName, attrs, "open");
}

export function voidTag(
  tagName: TagName,
  attrs: Record<AttrName, unknown>,
): string {
  return _tag(tagName, attrs, "void", "/");
}

export function closeTag(tagName: TagName): string {
  const token = new _Token(`</${tagName}>`);
  token.kind = "close";
  token.tagName = tagName;

  return token as string;
}

export function isSafe(value: unknown): value is string {
  return value instanceof _Token;
}

export function isTag(value: unknown, kind?: TagKind): value is Tag {
  return value instanceof _Token && !!value.kind && !!value.tagName &&
    (kind ? value.kind === kind : true);
}

function _tag(
  tagName: string,
  attributes: Record<AttrName, unknown>,
  kind: TagKind,
  close: "/" | "" = "",
): string {
  let attrStr = "";

  for (const [name, value] of Object.entries(attributes)) {
    if (isValidAttr(name, value)) {
      attrStr += ` ${name}`;

      if (value !== true) {
        attrStr += `="${escape(value)}"`;
      }
    }
  }

  const token = new _Token(`<${tagName}${attrStr}${close}>`);
  token.kind = kind;
  token.tagName = tagName;
  token.attributes = attributes;

  return token as string;
}
