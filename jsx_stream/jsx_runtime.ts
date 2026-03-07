// deno-lint-ignore-file no-explicit-any
import { streamComponent } from "./stream_component.ts";
import { streamElement } from "./stream_element.ts";
import { streamFragment } from "@http/html-stream/stream-fragment";
import { streamUnknown } from "./stream_unknown.ts";
import { html } from "@http/html-stream/template";
import { escape, partialHtml, safe } from "@http/html-stream/token";
import { isValidAttr } from "@http/html-stream/util";
import type { AttrName, HtmlNode } from "@http/html-stream/types";

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

export function jsxAttr(name: AttrName, value: unknown): string {
  if (isValidAttr(name, value)) {
    return partialHtml(`${name}="${escape(String(value))}"`);
  } else {
    return safe("");
  }
}

export function isValidTag(tag: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9\-]*$/.test(tag);
}

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
