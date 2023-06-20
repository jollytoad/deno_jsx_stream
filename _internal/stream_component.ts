import type {
  ComponentType,
  Promisable,
  Properties,
  StreamableNode,
} from "../types.ts";

export function streamComponent(
  component: ComponentType,
  props: Properties,
): Promisable<StreamableNode> {
  return component(props);
}
