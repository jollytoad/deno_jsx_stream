/**
 * A node of the structure token stream
 */
export type Node<T> = SyncNode<T> | AsyncNode<T>;
/**
 * A synchronous node
 */
export type SyncNode<T> = null | T | Iterable<Node<T>>;
/**
 * An asynchronous node
 */
export type AsyncNode<T> = PromiseLike<Node<T>> | AsyncIterable<Node<T>>;
/**
 * A node that can be awaited
 */
export type AwaitedNode<T> = SyncNode<T> | AsyncIterable<Node<T>>;
/**
 * A single iteration from an async iterable of nodes, consisting
 * of an awaitable node item, and the iterator from which to get
 * the next item.
 */
export type NodeIteration<T> = IteratorResult<AwaitedNode<T>> & {
  iterator: AsyncIterator<Node<T>>;
};

export type Awaitable<T> = T | PromiseLike<T>;

/**
 * An identifier to link a deferred substitution back to its placeholder
 */
export type PlaceholderId = string;
/**
 * A function to render a placeholder for a deferred node, the given
 * id will be later used by the substitution to find this placeholder
 */
export type PlaceholderRenderer<T> = (id: PlaceholderId) => T;
/**
 * A function to render the eventual substitution for a deferred node.
 * It's expected that some external mechanism will pick this out of the
 * stream, find the placeholder and replace it with this rendering.
 */
export type SubstitutionRenderer<T> = (
  id: PlaceholderId,
  deferred: AsyncIterable<T>,
) => AsyncIterable<T>;

/**
 * Options to configure the created {@link deferralHandler}.
 */
export interface DeferralOptions<T> {
  /**
   * The time (ms) to wait for an asynchronous node before substituting it
   * with a deferral placeholder.
   */
  timeout: number;
  /**
   * Function to render a placeholder for a deferred node.
   */
  placeholder: PlaceholderRenderer<T>;
  /**
   * Function to render once the deferred node eventually resolves,
   * the rendering would usually rely on some external mechanism to replace
   * the placeholder with the real nodes.
   */
  substitution: SubstitutionRenderer<T>;
  /**
   * By default, a random id is generated to link the placeholder and the
   * substitution together. An alternative deterministic function can be given
   * here instead for use in test cases.
   */
  generateId?: () => PlaceholderId;
}

/**
 * A set of functions to handle deferring of slow resolving nodes in a
 * stream, by dropping in a placeholder and an eventual substitution once
 * it resolves.
 */
export interface DeferralHandler<T> extends AsyncIterable<T> {
  /**
   * Determine whether the given promise of a node should be deferred.
   *
   * If this returns nothing, then defer function is called later with
   * the eventual tokens from the node.
   *
   * @returns the value of the promise or void to indicate deferral is
   *   preferred.
   */
  timeout<N>(value: PromiseLike<N>): PromiseLike<N | void>;

  /**
   * Called with the flatten stream of tokens from a previous deferral
   * @param deferred
   */
  defer(deferred: AsyncIterable<T>): T;
}

export type AsyncTransformer<I, O = I> = (
  tokens: AsyncIterable<I>,
) => AsyncIterable<O>;

export interface RenderOptions<T> {
  /**
   * Optional handling of slow nodes
   */
  deferralHandler?: DeferralHandler<T>;

  /**
   * A collection of token stream transformation functions
   */
  transformers?: Iterable<AsyncTransformer<T>>;
}
