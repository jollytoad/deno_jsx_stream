import type { Node } from "../token_stream/types.ts";

export type HtmlNode = Node<HtmlToken>;

export type TagName = string;
export type AttrName = string;

export type TagKind = "open" | "void" | "close";

export interface Tag {
  kind: TagKind;
  tagName: TagName;
  attributes?: Record<AttrName, unknown>;
}

export type HtmlToken = Tag | string;

export interface Context {
  scripts: Set<string>;
  stylesheets: Set<string>;
}

export interface TagHooks<T = HtmlToken> {
  beforeStart?: (openTag: Tag, context: Context) => Node<T> | void;
  afterStart?: (openTag: Tag, context: Context) => Node<T> | void;
  beforeEnd?: (openTag: Tag, context: Context, tokens?: T[]) => Node<T> | void;
  afterEnd?: (openTag: Tag, context: Context, tokens?: T[]) => Node<T> | void;

  /**
   * Declare that all tokens within an element (including the element tags themselves)
   * should be collected and passed into the beforeEnd/afterEnd hook.
   */
  collectTokens?: boolean;
}

export type Placement = keyof Omit<TagHooks, "collectTokens">;

export type TagHandlers = Record<TagName, TagHooks>;
