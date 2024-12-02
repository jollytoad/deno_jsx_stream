import { prependDocType } from "./transform/prepend_doctype.ts";
import { isSafe } from "./token.ts";
import { safetyFilter } from "@http/token-stream/transform/safety-filter";
import { catchErrors } from "@http/token-stream/transform/catch-errors";
import { renderBody } from "@http/token-stream/render-body";
import type { HtmlNode, HtmlToken } from "./types.ts";
import type { RenderOptions } from "@http/token-stream/types";

/**
 * Render the given node as a HTML {@linkcode Response} body with a prepended DOCTYPE,
 * and safety checking tokens are valid and not raw string.
 *
 * @param node the node
 * @param options rendering options
 * @returns A {@linkcode ReadableStream} of the serialized node
 */
export function renderHtmlBody(
  node: HtmlNode,
  options?: RenderOptions<HtmlToken>,
): BodyInit {
  const transformers = [
    prependDocType(),
    ...(options?.transformers ?? []),
    safetyFilter(isSafe),
    catchErrors<HtmlToken>(),
  ];
  return renderBody(node, {
    ...options,
    transformers,
  });
}
