import {
  isAsyncIterable,
  isIterable,
  isNodeIteration,
  isPromiseLike,
} from "../token_stream/guards.ts";
import { closeTag, openTag, safe, voidTag } from "./token.ts";
import { assertEquals, assertFalse } from "@std/assert";

Deno.test("safe string", () => {
  assertToken(safe("this"), "this");
});

// TODO: a raw string should probably not be classed as a token

Deno.test("number", () => {
  assertToken(100, "100");
});

Deno.test("bigint", () => {
  assertToken(100n, "100");
});

Deno.test("boolean true", () => {
  assertToken(true, "true");
});

Deno.test("boolean false", () => {
  assertToken(false, "false");
});

Deno.test("openTag", () => {
  assertToken(openTag("this", {}), "<this>");
});

Deno.test("openTag with attributes", () => {
  assertToken(openTag("this", { "a": "A", "b": "B" }), '<this a="A" b="B">');
});

Deno.test("voidTag", () => {
  assertToken(voidTag("this", {}), "<this/>");
});

Deno.test("voidTag with attributes", () => {
  assertToken(voidTag("this", { "a": "A", "b": "B" }), '<this a="A" b="B"/>');
});

Deno.test("closeTag", () => {
  assertToken(closeTag("this"), "</this>");
});

function assertToken(actual: unknown, expected: string) {
  assertEquals(String(actual), expected);
  assertFalse(isPromiseLike(actual), "expected token to not be Promise like");
  assertFalse(isIterable(actual), "expected token to not be iterable");
  assertFalse(
    isAsyncIterable(actual),
    "expected token to not be async iterable",
  );
  assertFalse(
    isNodeIteration(actual),
    "expected token to not be a node iteration",
  );
}
