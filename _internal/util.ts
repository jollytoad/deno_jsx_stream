import type { AttrName, TagName } from "../types.ts";

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

export function isVoidElement(tag: TagName): boolean {
  return VOID_ELEMENTS.has(tag);
}

export function isValidTag(tag: TagName): boolean {
  return /^[a-zA-Z][a-zA-Z0-9\-]*$/.test(tag);
}

export function isValidAttr(name: AttrName, value: unknown): boolean {
  return value !== false && value !== undefined && value !== null &&
    /^[a-zA-Z][a-zA-Z0-9\-]*$/.test(name);
}
