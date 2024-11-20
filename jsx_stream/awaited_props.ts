import { isPromiseLike } from "@http/token-stream/guards";
import type { AwaitedRecord, Properties } from "./types.ts";

/**
 * If any property value is a Promise, await it (and all other Promise values),
 * returning a Promise of the properties where all values are resolved.
 *
 * Otherwise, just return the properties as they are.
 */
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
