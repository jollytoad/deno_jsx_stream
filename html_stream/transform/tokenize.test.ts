// deno-fmt-ignore-file
import { tokenize, type TokenizeOptions } from "./tokenize.ts";
import { html } from "../template.ts";
import { attr, closeTag, docType, openTag, safe, voidTag } from "../token.ts";
import type { HtmlNode, HtmlToken } from "../types.ts";
import { assertEquals, assertRejects } from "@std/assert";
import { flattenTokens } from "@http/token-stream/flatten-tokens";

async function testTokenize(input: Iterable<HtmlNode>, expected: HtmlToken[], options?: TokenizeOptions) {
  const actual = await Array.fromAsync(tokenize(options)(flattenTokens(input)));
  for (let i = 0; i < actual.length; i++) {
    assertEquals(actual[i], expected[i])
    assertEquals(String(actual[i]), String(expected[i]));
  }
  assertEquals(actual.length, expected.length);
}

async function testTokenizeError(input: Iterable<HtmlNode>, msgIncludes?: string) {
  await assertRejects(
    () => Array.fromAsync(tokenize({ throwErrors: true })(flattenTokens(input))),
    Error,
    msgIncludes
  );
}

Deno.test("open tag", async () => {
  await testTokenize(
    html`<div>`,
    [openTag("div")]
  );
});

Deno.test("void tag", async () => {
  await testTokenize(
    html`<br>`,
    [voidTag("br")]
  );
});

Deno.test("close tag", async () => {
  await testTokenize(
    html`</div>`,
    [closeTag("div")]
  );
});

Deno.test("doctype tag", async () => {
  await testTokenize(
    html`<!DOCTYPE html>`,
    [docType("html")]
  );
});

Deno.test("text content", async () => {
  await testTokenize(
    html`hello world`,
    [safe("hello world")]
  );
});

Deno.test("element containing text", async () => {
  await testTokenize(
    html`<div>hello</div>`,
    [openTag("div"), safe("hello"), closeTag("div")]
  );
});

Deno.test("open tag with attributes", async () => {
  await testTokenize(
    html`<div class="foo" id="bar">`,
    [openTag("div", { class: "foo", id: "bar" })]
  );
});

Deno.test("nested elements", async () => {
  await testTokenize(
    html`<div><span></span></div>`,
    [openTag("div"), openTag("span"), closeTag("span"), closeTag("div")]
  );
});

Deno.test("passes through tag tokens", async () => {
  await testTokenize(
    [openTag("div", { class: "test" })],
    [openTag("div", { class: "test" })]
  );
});

Deno.test("self closing tag disabled", async () => {
  await testTokenize(
    html`<div/>`,
    [openTag("div")]
  );
});

Deno.test("self closing tag enabled", async () => {
  await testTokenize(
    html`<div/>`,
    [openTag("div"), closeTag("div")],
    { selfClosing: true }
  );
});

Deno.test("self closing tag with space", async () => {
  await testTokenize(
    html`<div />`,
    [openTag("div"), closeTag("div")],
    { selfClosing: true }
  );
});

Deno.test("self closing a void tag", async () => {
  await testTokenize(
    html`<br/>`,
    [voidTag("br")],
    { selfClosing: true }
  );
});

Deno.test("self closing a void tag with space", async () => {
  await testTokenize(
    html`<br />`,
    [voidTag("br")],
    { selfClosing: true }
  );
});

Deno.test("known void tag", async () => {
  await testTokenize(
    html`<br>`,
    [voidTag("br")]
  );
});

Deno.test("img void tag with attributes", async () => {
  await testTokenize(
    html`<img src="test.png">`,
    [voidTag("img", { src: "test.png" })]
  );
});

Deno.test("attribute without value", async () => {
  await testTokenize(
    html`<input disabled>`,
    [voidTag("input", { disabled: true })]
  );
});

Deno.test("tag with attr token of true", async () => {
  await testTokenize(
    html`<input ${attr("disabled", true)}>`,
    [voidTag("input", { disabled: true })]
  );
});

Deno.test("tag with attr token of false", async () => {
  await testTokenize(
    html`<input ${attr("disabled", false)}>`,
    [voidTag("input")]
  );
});

Deno.test("tag with attr token of string", async () => {
  await testTokenize(
    html`<input ${attr("name", "foo")}>`,
    [voidTag("input", { name: "foo" })]
  );
});

Deno.test("mixed content", async () => {
  await testTokenize(
    html`before<div>middle</div>after`,
    [safe("before"), openTag("div"), safe("middle"), closeTag("div"), safe("after")]
  );
});

Deno.test("custom element", async () => {
  await testTokenize(
    html`<custom-element>`,
    [openTag("custom-element")]
  );
});

Deno.test("unclosed tag becomes text", async () => {
  await testTokenize(
    html`\u{3C}unclosed`,
    [safe("<unclosed")]
  );
});

Deno.test("nested html templates", async () => {
  await testTokenize(
    html`<div>${html`<span>`}`,
    [openTag("div"), openTag("span")]
  );
});

Deno.test("tag name case insensitive", async () => {
  await testTokenize(
    html`<DIV>`,
    [openTag("div")]
  );
});

Deno.test("single quoted attribute", async () => {
  await testTokenize(
    html`<div class='foo'>`,
    [openTag("div", { class: "foo" })]
  );
});

Deno.test("comment becomes text", async () => {
  await testTokenize(
    html`<!-- comment -->`,
    [safe("<!-- comment -->")]
  );
});

Deno.test("interpolated attribute value", async () => {
  await testTokenize(
    html`<div class="${'some'}-${'thing'}">`,
    [openTag("div", { class: "some-thing" })]
  );
});

Deno.test("interpolated attribute name", async () => {
  await testTokenize(
    html`\u{3C}div ${'class'}="some-thing">`,
    [openTag("div", { class: "some-thing" })]
  );
});

Deno.test("interpolated tag name", async () => {
  await testTokenize(
    html`<${'div'} class="some-thing">`,
    [openTag("div", { class: "some-thing" })]
  );
});

Deno.test("interpolated chunks", async () => {
  await testTokenize(
    html`${safe('<')}${'div'} ${safe('class="some')}${safe('-thing">')}`,
    [openTag("div", { class: "some-thing" })]
  );
});

Deno.test("invalid tag followed by tag token", async () => {
  await testTokenize(
    html`\u{3C}div ${openTag('span')}`,
    [safe("<div "), openTag("span")]
  );
});

Deno.test("invalid tag throws error when throwErrors is true", async () => {
  await testTokenizeError(
    html`< >`,
    "Invalid tag: < >",
  )
});

Deno.test("invalid attribute throws error when throwErrors is true", async () => {
  await testTokenizeError(
    html`<div =value>`,
    "Invalid attributes: =value",
  );
});

Deno.test("invalid tag name throws error when throwErrors is true", async () => {
  await testTokenizeError(
    html`<123>`,
    "Invalid tag name: 123",
  );
});
