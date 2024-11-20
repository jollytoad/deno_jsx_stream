export type SyncNode<T> = null | T | Iterable<Node<T>>;
export type AsyncNode<T> = Promise<Node<T>> | AsyncIterable<Node<T>>;
export type AwaitedNode<T> = SyncNode<T> | AsyncIterable<Node<T>>;
export type NodeIteration<T> = IteratorResult<AwaitedNode<T>> & {
  iterator: AsyncIterator<Node<T>>;
};
export type Node<T> = SyncNode<T> | AsyncNode<T>;

export type Awaitable<T> = T | Promise<T>;

export type PlaceholderId = string;
export type PlaceholderRenderer<T> = (id: PlaceholderId) => T;
export type SubstitutionRenderer<T> = (
  id: PlaceholderId,
  deferred: AsyncIterable<T>,
) => AsyncIterable<T>;

export interface DeferralOptions<T> {
  timeout: number;
  placeholder: PlaceholderRenderer<T>;
  substitution: SubstitutionRenderer<T>;
  generateId?: () => PlaceholderId;
}

export interface DeferralHandler<T> extends AsyncIterable<T> {
  /**
   * Determine whether the given promise of a node should be deferred.
   *
   * If this returns nothing, then defer function is called later with the eventual
   * tokens from the node.
   *
   * @returns the value of the promise or void to indicate deferral is preferred.
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
