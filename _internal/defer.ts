export function defaultPlaceholder(id: string) {
  return `<span id="${id}"></span>`;
}

export async function* defaultSubstitution(
  id: string,
  children: AsyncIterable<string>,
): AsyncIterable<string> {
  yield `<template id="_${id}">`;
  yield* children;
  yield `</template>`;
  yield `<script>document.getElementById("${id}").outerHTML = document.getElementById("_${id}").innerHTML;</script>`;
}
