import { prependDocType } from "./transform/prepend_doctype.ts";
import { isSafe } from "./token.ts";
import { safetyFilter } from "@http/token-stream/transform/safety-filter";
import { renderString } from "@http/token-stream/render-string";
import type { HtmlNode, HtmlToken } from "./types.ts";
import type { RenderOptions } from "@http/token-stream/types";

/**
 * Render the given node as a HTML string with a prepended DOCTYPE,
 * and safety checking tokens are valid and not raw string.
 *
 * @param node the HTML node
 * @param options rendering options
 * @returns A string of the serialized HTML
 */
export function renderHtmlString(
  node: HtmlNode,
  options?: Omit<RenderOptions<HtmlToken>, "deferralHandler">,
): Promise<string> {
  const transformers = [
    prependDocType(),
    ...(options?.transformers ?? []),
    safetyFilter(isSafe),
  ];
  return renderString(node, {
    ...options,
    transformers,
  });
}
