import type { HtmlNode, HtmlToken } from "./types.ts";
import type { RenderOptions } from "@http/token-stream/types";
import { renderHtmlBody } from "./render_html_body.ts";

/**
 * Options for `renderHtmlResponse` function
 */
export type RenderHtmlResponseOptions = RenderOptions<HtmlToken> & {
  /**
   * Additional headers to pass in the Response
   */
  headers?: HeadersInit;

  /**
   * A function that caches the given HtmlNode against the created
   * Response.
   *
   * @example
   * ```tsx
   * import { renderHtmlResponse } from "@http/html-stream/render-html-response";
   * import { cacheHtmlNode, getHtmlNode } from "@http/html-stream/response-node-cache";
   *
   * const response = renderHtmlResponse(<Hello/>, { cacheHtmlNode });
   *
   * const htmlNode = getHtmlNode(response);
   * ```
   *
   * @param response
   * @param node
   */
  cacheHtmlNode?: (response: Response, node: HtmlNode) => unknown;
};

/**
 * Render the given node as a HTML {@linkcode Response} with a prepended DOCTYPE.
 *
 * @param node the HTML node
 * @param options rendering options
 * @returns A {@linkcode Response}
 */
export function renderHtmlResponse(
  node: HtmlNode,
  options?: RenderHtmlResponseOptions,
): Response {
  const headers = new Headers(options?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "text/html; charset=utf-8");
  }
  const response = new Response(renderHtmlBody(node, options), {
    status: 200,
    statusText: "OK",
    headers,
  });

  options?.cacheHtmlNode?.(response, node);

  return response;
}
