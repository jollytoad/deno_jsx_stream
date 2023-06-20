// deno-lint-ignore require-yield
export async function* streamUnknown(type: unknown): AsyncIterable<string> {
  console.warn(`Unknown JSX type: ${type}`);
}
