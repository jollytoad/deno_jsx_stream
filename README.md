# Template streaming libraries

A set of libraries to aid the building of asynchronous streaming template
engines.

## `@http/token-stream`

Provides generic utilities and types for the flattening of complex templates
structures into a stream of tokens. Including strategies for deferral of slow
asynchronous content.

## `@http/html-stream`

Provides HTML specific tokens and utility functions

## `@http/jsx-stream`

Provide a JSX engine making use of `@http/token-stream` and `@http/html-stream`
to support (primarily server-side) rendering of async components.

## Examples

A Deno app serving up a bunch of examples.

To run the example app, clone this repo and run:

```sh
deno task start
```
