// deno-lint-ignore-file no-explicit-any
export * from "./jsx-runtime.ts";
import { jsx } from "./jsx-runtime.ts";
import type { Node } from "./types.ts";

const SRC_ATTR = getEnv("JSX_SRC_ATTR") ?? "jsx-src";

export function jsxDEV(
  type: any,
  props: any,
  _key?: string,
  _staticChildren?: boolean,
  source?: JsxSrc,
  _self?: any,
): Node {
  if (source && SRC_ATTR) {
    const src =
      `${source?.fileName}#${source?.lineNumber}:${source?.columnNumber}`;
    props = {
      ...props,
      [SRC_ATTR]: src,
    };
  }

  return jsx(type, props);
}

interface JsxSrc {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
}

function getEnv(name: string): string | undefined {
  try {
    if (globalThis.Deno?.env) {
      return Deno.env.get(name);
    }
  } catch {
    // ignore
  }
}
