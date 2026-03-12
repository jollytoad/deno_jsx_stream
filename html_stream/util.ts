/**
 * Utilities for validating tags, attributes, and void elements.
 * @module
 */

import type { AttrName, TagName } from "./types.ts";

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

/**
 * Check if a tag is a void element.
 *
 * Void elements cannot have children and don't need closing tags.
 * Examples: `br`, `img`, `input`, `hr`, `meta`, etc.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Glossary/Void_element}
 */
export function isVoidElement(tag: TagName): boolean {
  return VOID_ELEMENTS.has(tag);
}

/**
 * Check if a tag name is valid per the HTML specification.
 *
 * Valid tags must start with a letter and contain only
 * letters, numbers, or hyphens.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Glossary/Tag}
 */
export function isValidTag(tag: TagName): boolean {
  return /^[a-zA-Z][a-zA-Z0-9\-]*$/.test(tag);
}

const SPECIAL_ATTRS = new Set([
  "dangerouslySetInnerHTML",
]);

/**
 * Check if an attribute is valid and renderable.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Glossary/Attribute}
 */
export function isValidAttr(name: AttrName, value: unknown): boolean {
  return value !== false && value !== undefined && value !== null &&
    !SPECIAL_ATTRS.has(name) &&
    // deno-lint-ignore no-control-regex
    /^[^\u0000-\u001F\u007F-\u009F\s"'>/=\uFDD0-\uFDEF\p{NChar}]+$/u
      .test(name);
}
