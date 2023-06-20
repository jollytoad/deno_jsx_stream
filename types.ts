// deno-lint-ignore-file no-explicit-any
export type Node = string | DeferredNode;
export type StreamableNode = null | Node | Iterable<Node> | AsyncIterable<Node>;
export type Promisable<T> = T | PromiseLike<T>;
export type ComponentType<P = Properties> = (
  props: P,
) => Promisable<StreamableNode>;
export type Children = any;
export type Properties = Record<string, unknown>;
export type AwaitedRecord<P> = {
  [K in keyof P]: Awaited<P[K]>;
};
export type TagName = string;
export type AttrName = string;

export type Context = unknown;

export interface DeferredNode {
  id: string;
  children: Promisable<Children>;
}

export type PlaceholderRenderer = (id: string) => string;
export type SubstitutionRenderer = (
  id: string,
  children: AsyncIterable<string>,
) => AsyncIterable<string>;
