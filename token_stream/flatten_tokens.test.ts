import type { DeferralHandler, Node } from "./types.ts";
import { flattenTokens } from "./flatten_tokens.ts";
import { assertEquals } from "@std/assert";
import { delay } from "@std/async/delay";
import { deferralHandler } from "./deferral_handler.ts";

Deno.test("flatten empty array", async () => {
  await assertFlattens([], "");
});

Deno.test("flatten a safe string", async () => {
  await assertFlattens("this", "this");
});

Deno.test("flatten a promise", async () => {
  await assertFlattens(Promise.resolve("this"), "this");
});

Deno.test("flatten an array", async () => {
  await assertFlattens(["this", " ", "that"], "this that");
});

Deno.test("flatten a promise of an array", async () => {
  await assertFlattens(
    Promise.resolve(["this", " ", "that"]),
    "this that",
  );
});

Deno.test("flatten an array of promises", async () => {
  await assertFlattens([
    Promise.resolve("this"),
    Promise.resolve(" "),
    Promise.resolve("that"),
  ], "this that");
});

Deno.test("flatten nested arrays", async () => {
  await assertFlattens([
    ["this"],
    [
      " ",
      "that",
      [
        " ",
        [
          "other",
        ],
      ],
    ],
  ], "this that other");
});

Deno.test("flatten a sync iterable", async () => {
  await assertFlattens(nodes(), "this that");

  function* nodes() {
    yield "this";
    yield " ";
    yield "that";
  }
});

Deno.test("flatten an async iterable", async () => {
  await assertFlattens(nodes(), "this that");

  async function* nodes() {
    yield "this";
    yield " ";
    yield "that";
  }
});

Deno.test("flatten nested async iterables", async () => {
  await assertFlattens(nodes(), "this that other");

  async function* nodes() {
    yield "this";
    yield " ";
    yield "that";
    yield moreNodes(); // NOTE: this is deliberately yielding the AsyncIterable object, DO NOT ADD '*'
  }

  async function* moreNodes() {
    yield " ";
    yield "other";
  }
});

Deno.test("flatten an async iterable of promises", async () => {
  await assertFlattens(nodes(), "this that");

  async function* nodes() {
    yield Promise.resolve("this");
    yield Promise.resolve(" ");
    yield Promise.resolve("that");
  }
});

Deno.test("flatten an async iterable with delays", async () => {
  await assertFlattens(nodes(), "this that");

  async function* nodes() {
    await delay(10);
    yield "this";
    await delay(10);
    yield " ";
    await delay(10);
    yield "that";
  }
});

Deno.test("flatten a slow async iterable with deferral", async () => {
  await assertFlattens(
    [
      "before",
      nodes(),
      "after",
    ],
    'before{1}after{1:"this{2}"}{2:" {3}"}{3:"that"}',
    testDeferralHandler(),
  );

  async function* nodes() {
    await delay(10);
    yield "this";
    await delay(10);
    yield " ";
    await delay(10);
    yield "that";
  }
});

Deno.test("flatten an async iterable of delayed promises with deferral", async () => {
  await assertFlattens(
    [
      "before",
      nodes(),
      "after",
    ],
    'before{1}{2}{3}after{1:"this"}{2:" "}{3:"that"}',
    testDeferralHandler(),
  );

  function* nodes() {
    yield delayed(10, "this");
    yield delayed(10, " ");
    yield delayed(10, "that");
  }
});

Deno.test(
  "flatten an iterable of delayed promises with deferral expecting reverse order",
  async () => {
    await assertFlattens(
      [
        "before",
        delayed(30, "this"),
        delayed(20, " "),
        delayed(10, "that"),
        "after",
      ],
      'before{1}{2}{3}after{3:"that"}{2:" "}{1:"this"}',
      testDeferralHandler(),
    );
  },
);

async function delayed<V>(time: number, value: V): Promise<V> {
  await delay(time);
  return value;
}

function testDeferralHandler(timeout = 1) {
  let id = 0;
  return deferralHandler({
    timeout,
    placeholder(id) {
      return `{${id}}`;
    },
    async *substitution(id, tokens) {
      yield `{${id}:"`;
      yield* tokens;
      yield `"}`;
    },
    generateId() {
      return String(++id);
    },
  });
}

async function assertFlattens(
  node: Node<string>,
  expected: string,
  deferrals?: DeferralHandler<string>,
) {
  assertEquals(await concat(flattenTokens(node, deferrals)), expected);
}

async function concat(tokens: AsyncIterable<string>): Promise<string> {
  let out = "";
  for await (const token of tokens) {
    out += String(token);
  }
  return out;
}
