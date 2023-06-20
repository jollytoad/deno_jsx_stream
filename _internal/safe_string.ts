import { escape as escape_ } from "https://deno.land/std@0.192.0/html/entities.ts";

class _SafeString extends String {
}

export function safe(value: unknown): string {
  return new _SafeString(value) as string;
}

export function escape(value: unknown): string {
  return safe(escape_(String(value)));
}

export function isSafe(value: unknown): value is string {
  return value instanceof _SafeString;
}
