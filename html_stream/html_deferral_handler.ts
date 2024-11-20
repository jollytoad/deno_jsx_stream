import * as defaultDefer from "./defer/mod.ts";
import { deferralHandler } from "@http/token-stream/deferral-handler";
import type {
  DeferralHandler,
  DeferralOptions,
} from "@http/token-stream/types";
import type { HtmlToken } from "./types.ts";

export function htmlDeferralHandler(
  options?: Partial<DeferralOptions<HtmlToken>>,
): DeferralHandler<HtmlToken> {
  return deferralHandler({
    timeout: 100,
    ...defaultDefer,
    ...options,
  });
}
