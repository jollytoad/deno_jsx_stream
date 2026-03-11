// deno-fmt-ignore-file
import { tokenize, type TokenizeOptions } from "./tokenize.ts";
import { html } from "../template.ts";
import { closeTag, openTag, safe, voidTag } from "../token.ts";
import type { HtmlNode, HtmlToken } from "../types.ts";
import { assertEquals } from "@std/assert";
import { flattenTokens } from "@http/token-stream/flatten-tokens";

function doTokenize(input: Iterable<HtmlNode>, options?: TokenizeOptions): Promise<HtmlToken[]> {
  return Array.fromAsync(tokenize(options)(flattenTokens(input)))
}

function assertTokens(actual: HtmlToken[], ...expected: HtmlToken[]) {
  for (let i = 0; i < actual.length; i++) {
    assertEquals(actual[i], expected[i])
    assertEquals(String(actual[i]), String(expected[i]));
  }
  assertEquals(actual.length, expected.length);
}

Deno.test("open tag", async () => {
  const output = await doTokenize(html`<div>`);
  assertTokens(output, openTag("div"));
});

Deno.test("void tag", async () => {
  const output = await doTokenize(html`<br>`);
  assertTokens(output, voidTag("br"));
});

Deno.test("close tag", async () => {
  const output = await doTokenize(html`</div>`);
  assertTokens(output, closeTag("div"));
});

Deno.test("text content", async () => {
  const output = await doTokenize(html`hello world`);
  assertTokens(output, safe("hello world"));
});

Deno.test("element containing text", async () => {
  const output = await doTokenize(html`<div>hello</div>`);
  assertTokens(output, openTag("div"), safe("hello"), closeTag("div"));
});

Deno.test("open tag with attributes", async () => {
  const output = await doTokenize(html`<div class="foo" id="bar">`);
  assertTokens(output, openTag("div", { class: "foo", id: "bar" }));
});

Deno.test("nested elements", async () => {
  const output = await doTokenize(html`<div><span></span></div>`);
  assertTokens(output, openTag("div"), openTag("span"), closeTag("span"), closeTag("div"));
});

Deno.test("passes through tag tokens", async () => {
  const output = await doTokenize([openTag("div", { class: "test" })]);
  assertTokens(output, openTag("div", { class: "test" }));
});

Deno.test("self closing tag disabled", async () => {
  const output = await doTokenize(html`<div/>`);
  assertTokens(output, openTag("div"));
});

Deno.test("self closing tag enabled", async () => {
  const output = await doTokenize(html`<div/>`, { selfClosing: true });
  assertTokens(output, openTag("div"), closeTag("div"));
});

Deno.test("self closing tag with space", async () => {
  const output = await doTokenize(html`<div />`, { selfClosing: true });
  assertTokens(output, openTag("div"), closeTag("div"));
});

Deno.test("self closing a void tag", async () => {
  const output = await doTokenize(html`<br/>`, { selfClosing: true });
  assertTokens(output, voidTag("br"));
});

Deno.test("self closing a void tag with space", async () => {
  const output = await doTokenize(html`<br />`, { selfClosing: true });
  assertTokens(output, voidTag("br"));
});

Deno.test("known void tag", async () => {
  const output = await doTokenize(html`<br>`);
  assertTokens(output, voidTag("br"));
});

Deno.test("img void tag with attributes", async () => {
  const output = await doTokenize(html`<img src="test.png">`);
  assertTokens(output, voidTag("img", { src: "test.png" }));
});

Deno.test("attribute without value", async () => {
  const output = await doTokenize(html`<input disabled>`);
  assertTokens(output, voidTag("input", { disabled: true }));
});

Deno.test("mixed content", async () => {
  const output = await doTokenize(html`before<div>middle</div>after`);
  assertTokens(output, safe("before"), openTag("div"), safe("middle"), closeTag("div"), safe("after"));
});

Deno.test("custom element", async () => {
  const output = await doTokenize(html`<custom-element>`);
  assertTokens(output, openTag("custom-element"));
});

Deno.test("unclosed tag becomes text", async () => {
  const output = await doTokenize(html`\u{3C}unclosed`);
  assertTokens(output, safe("<unclosed"));
});

Deno.test("nested html templates", async () => {
  const output = await doTokenize(html`<div>${html`<span>`}`);
  assertTokens(output, openTag("div"), openTag("span"));
});

Deno.test("tag name case insensitive", async () => {
  const output = await doTokenize(html`<DIV>`);
  assertTokens(output, openTag("div"));
});

Deno.test("single quoted attribute", async () => {
  const output = await doTokenize(html`<div class='foo'>`);
  assertTokens(output, openTag("div", { class: "foo" }));
});

Deno.test("comment becomes text", async () => {
  const output = await doTokenize(html`<!-- comment -->`);
  assertTokens(output, safe("<!-- comment -->"));
});

Deno.test("interpolated attribute value", async () => {
  const output = await doTokenize(html`<div class="${'some'}-${'thing'}">`);
  assertTokens(output, openTag("div", { class: "some-thing" }));
});

Deno.test("interpolated attribute name", async () => {
  const output = await doTokenize(html`<div ${'class'}="some-thing">`);
  assertTokens(output, openTag("div", { class: "some-thing" }));
});

Deno.test("interpolated tag name", async () => {
  const output = await doTokenize(html`<${'div'} class="some-thing">`);
  assertTokens(output, openTag("div", { class: "some-thing" }));
});

Deno.test("interpolated chunks", async () => {
  const output = await doTokenize(html`${safe('<')}${'div'} ${safe('class="some')}${safe('-thing">')}`);
  assertTokens(output, openTag("div", { class: "some-thing" }));
});

Deno.test("invalid tag followed by tag token", async () => {
  const output = await doTokenize(html`<div ${openTag('span')}`);
  assertTokens(output, safe("<div "), openTag("span"));
});
