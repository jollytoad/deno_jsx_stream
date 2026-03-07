import type { HtmlNode } from "./types.ts";
import { safe } from "./token.ts";
import { streamFragment } from "./stream_fragment.ts";

/**
 * Tagged template literal for html, returning an Iterable of {@link HtmlNode}'s.
 */
export function* html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Iterable<HtmlNode> {
  for (let i = 0; i < strings.length; i++) {
    if (strings[i]) {
      yield safe(strings[i]);
    }

    yield* streamFragment(values[i]);
  }
}
