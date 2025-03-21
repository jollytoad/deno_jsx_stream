# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.1]

- [@http/jsx-stream] fix Fragment type to work-around error appearing since Deno
  2.2.0:
  `JSX element type '<>' does not have any construct or call signatures. deno-ts(2604)`

## [0.8.0]

### Changed

- [@http/html-stream] add `charset=utf-8` to default `Content-Type` header in
  `renderHtmlResponse`.

### Added

- [@http/html-stream] added `response-node-cache` to allow caching of an
  `HtmlNode` associated with a `Response`.
- [@http/html-stream] allow the `cacheHtmlNode` function to be passed in as an
  option of `renderHtmlResponse`.

## [0.7.0]

### Added

- [@http/token-stream] added `catchErrors` transform to catch and report/handle
  errors within a token stream.

### Changed

- [@http/html-stream] add `catchErrors` to the standard transformers used by
  `renderHtmlBody` to ensure errors are not silently discarded.

## [0.6.0]

### Changed

- [@http/token-stream] fix `deferralHandler` to emit deferred content in the
  order it resolves rather than the order it was added.
- [@http/html-stream] support passing headers to `renderHtmlResponse`.

## [0.5.0]

## BREAKING CHANGES

- major refactor into three separate packages: `@http/token-stream`,
  `@http/html-stream` & `@http/jsx-stream`.
- `import { renderBody } from "@http/jsx-stream";` is replaced with
  `import { renderHtmlBody } from "@http/html-stream";` with different options,
  or alternatively use `renderHtmlResponse` instead.

## [0.4.0]

### Changed

- when in dev mode (`"jsx": "react-jsxdev"`) add a `jsx-src` attribute to every
  element providing the file url with line and column numbers of the element
  with the source. The `JSX_SRC_ATTR` env var can be set to override the
  attribute name or suppress it if set to empty.
- update dependencies

## [0.3.0]

### Changed

- export `jsx-dev-runtime`
- update dependencies

## [0.2.0]

### Changed

- switch from underscores to dashes in exports (`serialize_sw` ->
  `serialize-sw`)
- update @std and @http lib dependencies
