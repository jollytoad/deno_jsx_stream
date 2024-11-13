// deno-lint-ignore-file no-explicit-any
import { streamComponent } from "./stream_component.ts";
import { streamElement } from "./stream_element.ts";
import { streamFragment } from "./stream_fragment.ts";
import { streamUnknown } from "./stream_unknown.ts";
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

export function isValidTag(tag: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9\-]*$/.test(tag);
}

export const jsxs = jsx;
export const jsxDEV = jsx;
export const Fragment = null;

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
