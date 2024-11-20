# HTML streaming utilities for template engines

Builds on top of the more generic `@http/token-stream` to provide HTML specific
tokens and utility functions.

Includes:

- a HTML specific `DeferralHandler`, that outputs placeholders and substitutions
  using `<template>` elements and snippets of inline JavaScript.
- rendering as a Response, a Body or a string.
- transformer to prepend a doctype.
- tag hooks transformer to allow additional content to be injected before/after
  tags, this is useful to inject scripts or styles for custom elements.
- hook to prettify the HTML.

This is used by the `@http/jsx-stream` package.
