import type { HtmlNode } from "@http/html-stream/types";
import type { ComponentType, Properties } from "./types.ts";

export function streamComponent(
  component: ComponentType,
  props: Properties,
): HtmlNode {
  return component(props);
}
