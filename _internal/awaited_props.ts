import { isPromiseLike } from "../guards.ts";
import type { AwaitedRecord, Properties } from "../types.ts";

export async function awaitedProps<P extends Properties>(
  props: P,
): Promise<AwaitedRecord<P>> {
  let promises: Promise<unknown>[] | undefined;
  let resolved!: AwaitedRecord<P>;

  for (
    const [name, value] of Object.entries(props) as [keyof P, P[keyof P]][]
  ) {
    if (isPromiseLike(value)) {
      resolved ??= { ...props as AwaitedRecord<P> };
      promises ??= [];

      promises.push((async () => {
        resolved[name] = await value;
      })());
    }
  }

  if (promises) {
    await Promise.allSettled(promises);
  } else {
    resolved = props as AwaitedRecord<P>;
  }

  return resolved;
}
