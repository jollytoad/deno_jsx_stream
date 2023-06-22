import type { ComponentType, Node, Properties } from "../types.ts";

export function streamComponent(
  component: ComponentType,
  props: Properties,
): Node {
  return component(props);
}
