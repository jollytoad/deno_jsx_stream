/**
 * JSX runtime that handles components, fragments, and intrinsic elements,
 * returning {@linkcode HtmlNode}s.
 * @module
 */

// deno-lint-ignore-file no-explicit-any
import { streamComponent } from "./stream_component.ts";
import { streamElement } from "./stream_element.ts";
import { streamFragment } from "@http/html-stream/stream-fragment";
import { streamUnknown } from "./stream_unknown.ts";
import { streamAttr } from "./stream_attr.ts";
import { html } from "@http/html-stream/template";
import { isValidTag } from "@http/html-stream/util";
import type { HtmlNode } from "@http/html-stream/types";

export function jsx(type: any, props: any): HtmlNode {
  if (typeof type === "function") {
    return streamComponent(type, props);
  } else if (type === null) {
    return streamFragment(props.children);
  } else if (isValidTag(type)) {
    return streamElement(type, props);
  } else {
    return streamUnknown(type);
  }
}

export const jsxTemplate = html;
export const jsxEscape = streamFragment;
export const jsxAttr = streamAttr;

export const jsxs = jsx;
export const jsxDEV = jsx;
export const Fragment = null as any;

// deno-lint-ignore no-namespace
export namespace JSX {
  export type Element = any;

  export type AsyncElement = any;

  export interface IntrinsicAttributes {
    key?: any;
  }

  export interface IntrinsicElements {
    [name: string]: any;
  }

  export interface ElementChildrenAttribute {
    children?: any;
  }
}
