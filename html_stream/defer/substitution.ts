import type { HtmlToken } from "../types.ts";
import { safe } from "../token.ts";

export async function* substitution(
  id: string,
  children: AsyncIterable<HtmlToken>,
): AsyncIterable<HtmlToken> {
  yield safe(`<template id="_${id}">`);
  yield* children;
  yield safe(`</template>`);
  yield safe(
    `<script>document.getElementById("${id}").outerHTML = document.getElementById("_${id}").innerHTML;</script>`,
  );
}
