/**
 * Type guards for checking primitives, promises, iterables, async iterables,
 * and node iterations.
 * @module
 */

import type { NodeIteration } from "./types.ts";

type PrimitiveValue = string | number | boolean | bigint;

/**
 * Type guard to check if a value is a primitive value.
 *
 * @example
 * ```ts
 * import { isPrimitiveValue } from "@http/token-stream/guards";
 *
 * isPrimitiveValue("hello"); // true
 * isPrimitiveValue(42); // true
 * isPrimitiveValue(true); // true
 * isPrimitiveValue({}); // false
 * ```
 */
export function isPrimitiveValue(value: unknown): value is PrimitiveValue {
  return typeof value === "string" || typeof value === "number" ||
    typeof value === "boolean" || typeof value === "bigint";
}

/**
 * Type guard to check if a value is a Promise-like object.
 *
 * @example
 * ```ts
 * import { isPromiseLike } from "@http/token-stream/guards";
 *
 * isPromiseLike(Promise.resolve(1)); // true
 * isPromiseLike({ then: (resolve) => resolve(1) }); // true
 * isPromiseLike(1); // false
 * ```
 */
export function isPromiseLike<T>(
  value: T | PromiseLike<T> | unknown,
): value is PromiseLike<T> {
  return typeof (value as PromiseLike<T>)?.then === "function";
}

/**
 * Type guard to check if a value is a synchronous iterable.
 *
 * Note: Strings are explicitly excluded as they're iterable but often
 * not intended to be treated as collections of nodes.
 *
 * @example
 * ```ts
 * import { isIterable } from "@http/token-stream/guards";
 *
 * isIterable([1, 2, 3]); // true
 * isIterable("hello"); // false (strings are excluded)
 * isIterable({}); // false
 * ```
 */
export function isIterable<T>(
  value: unknown | Iterable<T>,
): value is Iterable<T> {
  return typeof value !== "string" &&
    !(value instanceof String) &&
    typeof (value as Iterable<T>)?.[Symbol.iterator] === "function";
}

/**
 * Type guard to check if a value is an async iterable.
 *
 * @example
 * ```ts
 * import { isAsyncIterable } from "@http/token-stream/guards";
 *
 * async function* gen() { yield 1; }
 * isAsyncIterable(gen()); // true
 * isAsyncIterable([1, 2, 3]); // false
 * ```
 */
export function isAsyncIterable<T>(
  value: unknown | AsyncIterable<T>,
): value is AsyncIterable<T> {
  return typeof (value as AsyncIterable<T>)?.[Symbol.asyncIterator] ===
    "function";
}

/**
 * Type guard to check if a value is a NodeIteration object.
 *
 * A NodeIteration is an iterator result that includes a reference
 * to the iterator itself for continuing iteration.
 *
 * @example
 * ```ts
 * import { isNodeIteration } from "@http/token-stream/guards";
 *
 * const iter = [1, 2, 3][Symbol.iterator]();
 * const result = iter.next();
 * isNodeIteration(result); // true
 * isNodeIteration({ done: false, value: 1 }); // false
 * ```
 */
export function isNodeIteration<T>(
  node: unknown | NodeIteration<T>,
): node is NodeIteration<T> {
  return typeof (node as NodeIteration<T>)?.iterator?.next === "function";
}
