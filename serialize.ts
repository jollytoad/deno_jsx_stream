import { streamNode } from "./_internal/stream_node.ts";
import { readableStreamFromIterable } from "https://deno.land/std@0.193.0/streams/readable_stream_from_iterable.ts";
import type { JSX } from "./jsx-runtime.ts";
import type { RenderOptions } from "./types.ts";

export function renderBody(
  node: JSX.Element,
  options?: RenderOptions,
): BodyInit {
  return readableStreamFromIterable(streamNode(node, options)).pipeThrough(
    new TextEncoderStream(),
  );
}
