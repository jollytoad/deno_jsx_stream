import type { HtmlToken } from "../types.ts";
import { safe } from "../token.ts";

/**
 * Render a `template` element as a placeholder to eventually be filled by
 * deferred content.
 */
export function placeholder(id: string): HtmlToken {
  return safe(`<template id="${id}"></template>`);
}
