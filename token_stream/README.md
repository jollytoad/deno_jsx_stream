# Token streaming utilities for template engines

This is a collection of utility function to help turn structured/nested tokens
into a flat stream of tokens.

The ultimate goal is to end up with an `AsyncIterable` of tokens, given a more
complex structure of tokens.

This structure may be:

- a token
- a Promise of a token
- an Iterable of tokens
- an AsyncIterable of tokens
- or Promise, Iterable, or AsyncIterable of any of the above

The functions don't care what a token is, so long as it isn't a Promise, an
Iterable, or an AsyncIterable. A string will be seen as a token (rather than as
Iterable).

Also see `@http/html-stream` which adds HTML specific tokens and utility
functions on top, and also `@http/jsx-stream` which uses this to stream from JSX
templates.
