import type { HtmlNode, HtmlToken } from "./types.ts";
import type { RenderOptions } from "@http/token-stream/types";
import { renderHtmlBody } from "./render_html_body.ts";

/**
 * Render the given node as a HTML {@linkcode Response} with a prepended DOCTYPE.
 *
 * @param node the HTML node
 * @param options rendering options
 * @returns A {@linkcode Response}
 */
export function renderHtmlResponse(
  node: HtmlNode,
  options?: RenderOptions<HtmlToken>,
): Response {
  return new Response(renderHtmlBody(node, options), {
    status: 200,
    statusText: "OK",
    headers: {
      "Content-Type": "text/html",
    },
  });
}
