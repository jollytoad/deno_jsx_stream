import type { HtmlNode } from "./types.ts";

const cache = new WeakMap<Response, HtmlNode>();

/**
 * Cache the original HtmlNode against the Response in which it will be delivered.
 * This can be used to avoid having to parse the Response of Request handler when
 * called internally.
 *
 * @param response the Response that serializes the HtmlNode
 * @param node the original HtmlNode represented by the Response
 * @returns the Response passed in
 */
export function cacheHtmlNode(response: Response, node: HtmlNode): Response {
  cache.set(response, node);
  return response;
}

/**
 * Get the cached HtmlNode for a Response.
 *
 * @param response
 * @returns a HtmlNode if found
 */
export function getHtmlNode(response: Response): HtmlNode | undefined {
  return cache.get(response);
}

/**
 * Explicitly delete any cached HtmlNode associated with a Response.
 * This isn't strictly necessary, as a WeakMap is used for the cache,
 * so the HtmlNode should be automatically cleaned up when its Response
 * is garbage collected.
 *
 * @param response a Response that may have an associated cached HtmlNode
 */
export function invalidateHtmlNode(response: Response): void {
  cache.delete(response);
}
