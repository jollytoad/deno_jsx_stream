import { awaitedProps } from "./awaited_props.ts";
import { streamFragment } from "./stream_fragment.ts";
import { isValidAttr, isVoidElement } from "./util.ts";
import type { Children, Node, Properties, TagName } from "../types.ts";
import { escape, safe } from "./safe_string.ts";

export async function* streamElement(
  tag: TagName,
  props: Properties,
): AsyncIterable<Node> {
  const { children, ...attrs } = props && typeof props === "object"
    ? props
    : {} as Properties;

  let attrStr = "";
  for (const [name, value] of Object.entries(await awaitedProps(attrs))) {
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
