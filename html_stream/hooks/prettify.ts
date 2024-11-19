import { safe } from "../token.ts";
import type { TagHook } from "../types.ts";

export function prettify(options?: { indent?: number }): TagHook[] {
  const indent = " ".repeat(options?.indent ?? 2);
  return [{
    tag: "*",
    *beforeBegin(_tag, context) {
      yield safe("\n" + indent.repeat(context.stack.length - 1));
    },
    *beforeEnd(_tag, context) {
      yield safe("\n" + indent.repeat(context.stack.length - 1));
    },
  }];
}
