# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0]

## BREAKING CHANGES

- major refactor into three separate packages: `@http/token-stream`, `@http/html-stream` & `@http/jsx-stream`.
- `import { renderBody } from "@http/jsx-stream";` is replaced with `import { renderHtmlBody } from "@http/html-stream";` with different options, or alternatively use `renderHtmlResponse` instead.

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
