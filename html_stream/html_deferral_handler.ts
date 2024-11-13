import * as defaultDefer from "@http/html-stream/defer";
import { deferralHandler } from "@http/token-stream/deferral-handler";
import type {
  DeferralHandler,
  DeferralOptions,
} from "@http/token-stream/types";
import type { HtmlToken } from "@http/html-stream/types";

export function htmlDeferralHandler(
  options?: Partial<DeferralOptions<HtmlToken>>,
): DeferralHandler<HtmlToken> {
  return deferralHandler({
    timeout: 100,
    ...defaultDefer,
    ...options,
  });
}
