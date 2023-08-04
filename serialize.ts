import { streamNode } from "./_internal/stream_node.ts";
import type { JSX } from "./jsx-runtime.ts";
import type { RenderOptions } from "./types.ts";

export function renderBody(
  node: JSX.Element,
  options?: RenderOptions,
): BodyInit {
  return ReadableStream.from(streamNode(node, options)).pipeThrough(
    new TextEncoderStream(),
  );
}
