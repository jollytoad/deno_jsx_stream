import type { HtmlToken } from "../types.ts";
import { safe } from "../token.ts";

export function placeholder(id: string): HtmlToken {
  return safe(`<template id="${id}"></template>`);
}
