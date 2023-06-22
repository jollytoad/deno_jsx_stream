export type SyncNode = null | string | Iterable<Node>;
export type AsyncNode = Promise<Node> | AsyncIterable<Node>;
export type Node = SyncNode | AsyncNode;

export type Promisable<T> = T | Promise<T>;

export type ComponentType<P = Properties> = (
  props: P,
) => Node;

// deno-lint-ignore no-explicit-any
export type Children = any;
export type Properties = Record<string, unknown>;

export type AwaitedRecord<P> = {
  [K in keyof P]: Awaited<P[K]>;
};

export type TagName = string;
export type AttrName = string;

export type PlaceholderRenderer = (id: string) => string;
export type SubstitutionRenderer = (
  id: string,
  children: AsyncIterable<string>,
) => AsyncIterable<string>;

export interface RenderOptions {
  /**
   * Enable deferral of slow async components.
   *
   * Any async component that takes longer than the given timeout will be deferred,
   * and replaced with a placeholder in the stream.
   * The component will eventually be rendered at the end of the stream in a block of
   * Javascript that replaces the placeholder in the browser.
   *
   * Setting this to falsy will disable deferral.
   */
  deferredTimeout?: number | false;

  /**
   * Provide a custom deferred placeholder rendering function.
   */
  deferredPlaceholder?: PlaceholderRenderer;

  /**
   * Provide a custom function to render the substitution of a deferred stream.
   */
  deferredSubstitution?: SubstitutionRenderer;

  /**
   * Enable a delay during streaming.
   *
   * This allows you to see the actual effect of streaming whilst developing locally.
   */
  streamDelay?: number;
}
