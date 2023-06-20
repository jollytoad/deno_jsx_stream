import { _deferredPlaceholder, _deferredSubstitution } from "../config.ts";
import type { Children, DeferredNode, Promisable } from "../types.ts";

class _DeferredNode implements DeferredNode {
  id: string;
  children: Promisable<Children>;

  constructor(children: Promisable<Children>) {
    this.id = crypto.randomUUID();
    this.children = children;
  }
}

export function defer(children: Promisable<Children>): DeferredNode {
  return new _DeferredNode(children);
}

export function isDeferred(node: unknown): node is DeferredNode {
  return node instanceof _DeferredNode;
}

export function renderPlaceholder(id: string) {
  return (_deferredPlaceholder ?? defaultPlaceholder)(id);
}

export function renderSubstitution(
  id: string,
  children: AsyncIterable<string>,
): AsyncIterable<string> {
  return (_deferredSubstitution ?? defaultSubstitution)(id, children);
}

function defaultPlaceholder(id: string) {
  return `<span id="${id}"></span>`;
}

async function* defaultSubstitution(
  id: string,
  children: AsyncIterable<string>,
): AsyncIterable<string> {
  yield `<template id="_${id}">`;
  yield* children;
  yield `</template>`;
  yield `<script>document.getElementById("${id}").outerHTML = document.getElementById("_${id}").innerHTML;</script>`;
}
