import { isPromiseLike } from "../guards.ts";
import type { AwaitedRecord, Properties } from "../types.ts";

export function awaitedProps<P extends Properties>(
  props: P,
): P | Promise<AwaitedRecord<P>> {
  type Entry = [keyof P, P[keyof P]];

  const promisedEntries: Promise<Entry>[] = [];

  for (
    const [name, value] of Object.entries(props) as Entry[]
  ) {
    if (isPromiseLike(value)) {
      promisedEntries.push((async () => [name, await value])());
    }
  }

  if (promisedEntries.length) {
    return Promise.all(promisedEntries).then((entries) => ({
      ...props,
      ...Object.fromEntries(entries),
    } as AwaitedRecord<P>));
  } else {
    return props;
  }
}
