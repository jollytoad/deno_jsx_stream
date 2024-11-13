import { flattenTokens } from "./flatten_tokens.ts";
import { transformTokens } from "./transform_tokens.ts";
import { asStrings } from "./transform/as_strings.ts";
import type { Node, RenderOptions } from "./types.ts";

/**
 * Render the given node, flattening, and serializing to a single string.
 *
 * @param node the node
 * @param options rendering options
 * @returns A string of the serialized node
 */
export async function renderString<T>(
  node: Node<T>,
  options?: Omit<RenderOptions<T>, "deferralHandler">,
): Promise<string> {
  let tokens = flattenTokens(node);
  tokens = transformTokens<T>(options?.transformers)(tokens);
  const chunks = asStrings()(tokens);

  let output = "";
  for await (const chunk of chunks) {
    output += chunk;
  }
  return output;
}
