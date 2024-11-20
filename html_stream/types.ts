import type { Node } from "@http/token-stream/types";

export type HtmlNode = Node<HtmlToken>;

export type TagName = string;
export type TagPattern = string;
export type AttrName = string;

export type TagKind = "open" | "void" | "close";

export interface Tag {
  kind: TagKind;
  tagName: TagName;
  attributes?: Record<AttrName, unknown>;
}

/**
 * A HTML token may be a tag or text.
 */
export type HtmlToken = Tag | string;

/**
 * Associate a tag name or pattern, with a set of advices, and other options.
 */
export interface TagHook extends TagAdvices {
  /**
   * The tag to apply these advices to.
   *
   * May be an exact tag name or contain a wildcard pattern:
   *
   * - `*` - matches all tags
   * - `my-*` - matches all tags prefixed with `my-`
   */
  tag: TagPattern;

  /**
   * Declare that all tokens within an element (including the element tags themselves)
   * should be collected and passed into the beforeEnd/afterEnd hook.
   */
  collectTokens?: boolean;
}

/**
 * The advice functions that are called around a tag in the token stream.
 */
export interface TagAdvices {
  /**
   * Called before an open or void tag: ^`<tag>`, ^`<tag/>`
   */
  beforeBegin?: TagAdvice;

  /**
   * Called after an open tag (but not a void tag): `<tag>`^
   */
  afterBegin?: TagAdvice;

  /**
   * Called before a closing tag: ^`</tag>`
   */
  beforeEnd?: TagAdvice;

  /**
   * Called after a closing or void tag: `</tag>`^, `<tag/>`^
   */
  afterEnd?: TagAdvice;
}

/**
 * Valid tag advice names, these follow the names used in the `insertAdjacent` methods
 * of the Element DOM class.
 */
export type TagAdviceName = keyof TagAdvices;

/**
 * An 'advice' function for a tag.
 *
 * @param openTag the opening tag of the element
 * @param context additional context data for the tag
 */
export type TagAdvice = (
  openTag: Tag,
  context: Context,
) => Node<HtmlToken> | void;

/**
 * Context data passed to each TagAdvice.
 */
export interface Context<T = HtmlToken> {
  scripts: Set<string>;
  stylesheets: Set<string>;
  stack: Tag[];
  tokens?: T[];
}
