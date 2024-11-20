import { readableStreamFromIterable } from "./readable_stream_from_iterable.ts";
import { flattenTokens } from "./flatten_tokens.ts";
import { transformTokens } from "./transform_tokens.ts";
import { asEncoded } from "./transform/as_encoded.ts";
import type { Node, RenderOptions } from "./types.ts";

/**
 * Render the given node, flattening, serializing and encoding, suitable for passing into a {@linkcode Response} body.
 *
 * @param node the node
 * @param options rendering options
 * @returns A {@linkcode ReadableStream} of the serialized node
 */
export function renderBody<T>(
  node: Node<T>,
  options?: RenderOptions<T>,
): BodyInit {
  let tokens = flattenTokens(node, options?.deferralHandler);
  tokens = transformTokens<T>(options?.transformers)(tokens);
  const chunks = asEncoded()(tokens);

  return readableStreamFromIterable(chunks);
}
