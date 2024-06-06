import { streamNode } from "./_internal/stream_node.ts";
import type { JSX } from "./jsx-runtime.ts";
import type { RenderOptions } from "./types.ts";

/**
 * Render the given JSX as a stream suitable for passing into a {@linkcode Response} body.
 *
 * NOTE: this will not include a doctype, but there is a helper function to prepend that...
 *
 * @example
 * ```ts
 * import { renderBody } from "@http/jsx-stream";
 * import { html } from "@http/response/html";
 * import { prependDocType } from "@http/response/prepend-doctype";
 *
 * Deno.serve(() => {
 *   return html(
 *     prependDocType(
 *       renderBody(
 *         <html>
 *           <body>
 *             <h1>Hello World</h1>
 *           </body>
 *         </html>
 *       )
 *     )
 *   );
 * });
 * ```
 *
 * @param node the JSX node
 * @param options rendering options
 * @returns A {@linkcode ReadableStream} of the serialized JSX
 */
export function renderBody(
  node: JSX.Element,
  options?: RenderOptions,
): BodyInit {
  return ReadableStream.from(streamNode(node, options)).pipeThrough(
    new TextEncoderStream(),
  );
}

/**
 * Render the given JSX as a string.
 *
 * This is an alternative to {@linkcode renderBody} for situations that
 * require just a string, or where streaming is not necessary or possible.
 *
 * Prefer {@linkcode renderBody} when rendering for a {@linkcode Response} over this.
 *
 * @example
 * ```ts
 * console.log(renderString(
 *   <html>
 *     <body>
 *       <h1>Hello World</h1>
 *     </body>
 *   </html>
 * ));
 * ```
 *
 * @param node the JSX node
 * @param options rendering options
 * @returns A string of the serialized JSX
 */
export async function renderString(
  node: JSX.Element,
  options?: Pick<RenderOptions, "tagHandlers">,
): Promise<string> {
  let output = "";
  for await (
    const chunk of streamNode(node, { ...options, deferredTimeout: false })
  ) {
    output += chunk;
  }
  return output;
}
