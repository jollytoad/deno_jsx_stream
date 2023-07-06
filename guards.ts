type PrimitiveValue = string | number | boolean | bigint;

export function isPrimitiveValue(value: unknown): value is PrimitiveValue {
  return typeof value === "string" || typeof value === "number" ||
    typeof value === "boolean" || typeof value === "bigint";
}

export function isPromiseLike<T>(
  value: T | PromiseLike<T> | unknown,
): value is PromiseLike<T> {
  return typeof (value as PromiseLike<T>)?.then === "function";
}

export function isIterable<T>(
  value: unknown | Iterable<T>,
): value is Iterable<T> {
  return typeof value !== "string" &&
    typeof (value as Iterable<T>)?.[Symbol.iterator] === "function";
}

export function isAsyncIterable<T>(
  value: unknown | AsyncIterable<T>,
): value is AsyncIterable<T> {
  return typeof (value as AsyncIterable<T>)?.[Symbol.asyncIterator] ===
    "function";
}
