// deno-lint-ignore-file no-explicit-any
import { streamComponent } from "./_internal/stream_component.ts";
import { streamElement } from "./_internal/stream_element.ts";
import { streamFragment } from "./_internal/stream_fragment.ts";
import { streamUnknown } from "./_internal/stream_unknown.ts";
import { isValidTag } from "./_internal/util.ts";
import type { AsyncNode, Node } from "./types.ts";

// IMPORTANT: This is UNSAFE experimental code, do not use in production.

export function jsx(type: any, props: any): Node {
  // console.group(type, props);

  try {
    if (typeof type === "function") {
      return streamComponent(type, props);
    } else if (type === null) {
      return streamFragment(props.children);
    } else if (isValidTag(type)) {
      return streamElement(type, props);
    } else {
      return streamUnknown(type);
    }
  } finally {
    // console.groupEnd();
  }
}

export const jsxs = jsx;
export const jsxDEV = jsx;
export const Fragment = null;

// deno-lint-ignore no-namespace
export namespace JSX {
  export type Element = any;

  export type AsyncElement = AsyncNode;

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
