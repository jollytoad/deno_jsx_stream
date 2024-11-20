import type { AsyncTransformer } from "@http/token-stream/types";
import { docType } from "../token.ts";
import type { HtmlToken } from "../types.ts";

export function prependDocType(
  type = "html",
): AsyncTransformer<HtmlToken> {
  return async function* (tokens) {
    yield docType(type);
    yield* tokens;
  };
}
