import { awaitedProps } from "./awaited_props.ts";
import { streamFragment } from "./stream_fragment.ts";
import { isValidAttr, isVoidElement } from "./util.ts";
import type { Children, Node, Properties, TagName } from "../types.ts";
import { escape, safe } from "./safe_string.ts";
import { isPromiseLike } from "../guards.ts";

export function* streamElement(
  tag: TagName,
  props: Properties,
): Iterable<Node> {
  const { children, ...attrs } = props && typeof props === "object"
    ? props
    : {} as Properties;

  const awaitedAttrs = awaitedProps(attrs);

  if (isPromiseLike(awaitedAttrs)) {
    yield awaitedAttrs.then((attrs) => {
      return streamElement(tag, { children, attrs });
    });
  } else {
    let attrStr = "";
    for (const [name, value] of Object.entries(awaitedAttrs)) {
      if (isValidAttr(name, value)) {
        attrStr += ` ${name}`;

        if (value !== true) {
          attrStr += `="${escape(value)}"`;
        }
      }
    }

    if (isVoidElement(tag)) {
      // Although self-closing tags are ignored in HTML5, they are required in XML/XHTML/SVG,
      // and it does no harm adding them, and makes void elements more obvious when debugging output.
      yield safe(`<${tag}${attrStr}/>`);
    } else {
      yield safe(`<${tag}${attrStr}>`);

      yield* streamFragment(children as Children);

      yield safe(`</${tag}>`);
    }
  }
}
