import { streamNode } from "./_internal/stream_node_sw.ts";
import type { JSX } from "./jsx-runtime.ts";
import type { RenderOptions } from "./types.ts";

/**
 * renderBody optimised for use in ServiceWorker
 */
export function renderBody(
  node: JSX.Element,
  options?: RenderOptions,
): BodyInit {
  return ReadableStream.from(streamNode(node, options)).pipeThrough(
    new TextEncoderStream(),
  );
}
