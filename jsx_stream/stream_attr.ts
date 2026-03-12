import { attr } from "@http/html-stream/token";
import { isPromiseLike } from "@http/token-stream/guards";
import type { AttrName, AttrValue, HtmlNode } from "@http/html-stream/types";

export function* streamAttr(
  name: AttrName,
  value: AttrValue,
): Iterable<HtmlNode> {
  if (isPromiseLike(value)) {
    yield value.then((v) => streamAttr(name, v));
  } else {
    yield attr(name, value);
  }
}
