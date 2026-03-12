/**
 * Functions for rendering a HTML token stream (or tree of nodes)
 * as a {@linkcode Response}, {@linkcode Body}, or string.
 *
 * These utilities stream HTML to the client with automatic DOCTYPE
 * insertion and proper Content-Type headers.
 *
 * @example
 * ```ts
 * import { html } from "@http/html-stream/template";
 * import { renderHtmlResponse } from "@http/html-stream";
 *
 * const response = renderHtmlResponse(html`<div>Hello World</div>`);
 * ```
 *
 * @module
 */

export { renderHtmlResponse } from "./render_html_response.ts";
export { renderHtmlBody } from "./render_html_body.ts";
export { renderHtmlString } from "./render_html_string.ts";
