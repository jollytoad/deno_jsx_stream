import type { HtmlNode } from "@http/html-stream/types";

export type ComponentType<P = Properties> = (
  props: P,
) => HtmlNode;

export interface RequestProps {
  req: Request;
}

// deno-lint-ignore no-explicit-any
export type Children = any;
export type Properties = Record<string, unknown>;

export type AwaitedRecord<P> = {
  [K in keyof P]: Awaited<P[K]>;
};
