import { awaitedProps } from "./awaited_props.ts";
import { streamFragment } from "./stream_fragment.ts";
import { isVoidElement } from "@http/html-stream/util";
import type { Children, Properties } from "./types.ts";
import { closeTag, openTag, safe, voidTag } from "@http/html-stream/token";
import { isPromiseLike } from "@http/token-stream/guards";
import type { HtmlNode, TagName } from "@http/html-stream/types";

export function* streamElement(
  tagName: TagName,
  props: Properties,
): Iterable<HtmlNode> {
  const { children, ...attrs } = props && typeof props === "object"
    ? props
    : {} as Properties;

  const awaitedAttrs = awaitedProps(attrs);

  if (isPromiseLike(awaitedAttrs)) {
    // We are awaiting some async attrs to be resolved,
    // so yield a promise of this streamed element.
    yield awaitedAttrs.then((attrs) => {
      return streamElement(tagName, { children, attrs });
    });
  } else {
    if (isVoidElement(tagName)) {
      // Although self-closing tags are ignored in HTML5, they are required in XML/XHTML/SVG,
      // and it does no harm adding them, and makes void elements more obvious when debugging output.
      yield voidTag(tagName, awaitedAttrs);
    } else {
      yield openTag(tagName, awaitedAttrs);

      const __html =
        (awaitedAttrs.dangerouslySetInnerHTML as { __html: string })?.__html;

      if (typeof __html === "string") {
        yield safe(__html);
      } else {
        yield* streamFragment(children as Children);
      }

      yield closeTag(tagName);
    }
  }
}
