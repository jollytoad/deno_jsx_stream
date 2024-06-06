import { readableStreamFromIterable } from "./_internal/readable_stream_from_iterable.ts";
import { streamNode } from "./_internal/stream_node_sw.ts";
import type { JSX } from "./jsx-runtime.ts";
import type { RenderOptions } from "./types.ts";

/**
 * `renderBody` optimised for use in a ServiceWorker
 */
export function renderBody(
  node: JSX.Element,
  options?: RenderOptions,
): BodyInit {
  return readableStreamFromIterable(streamNode(node, options)).pipeThrough(
    new TextEncoderStream(),
  );
}

/**
 * `renderString` optimised for use in a ServiceWorker
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
