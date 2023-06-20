import type { PlaceholderRenderer, SubstitutionRenderer } from "./types.ts";

/**
 * Enable deferral of slow async components.
 *
 * Any async component that takes longer than the given timeout will be deferred,
 * and replaced with a placeholder in the stream.
 * The component will eventually be rendered at the end of the stream in a block of
 * Javascript that replaces the placeholder in the browser.
 *
 * Setting this to falsy will disable deferral.
 */
export function setDeferredTimeout(timeoutMs?: number | false) {
  _deferredTimeout = asSafeInteger(timeoutMs);
}

/**
 * Provide a custom deferred placeholder rendering function.
 */
export function setDeferredPlaceholder(fn?: PlaceholderRenderer) {
  _deferredPlaceholder = typeof fn === "function" ? fn : undefined;
}

/**
 * Provide a custom function to render the substitution of a deferred stream.
 */
export function setDeferredSubstitution(fn?: SubstitutionRenderer) {
  _deferredSubstitution = typeof fn === "function" ? fn : undefined;
}

/**
 * Enable a delay during streaming.
 *
 * This allows you to see the actual effect of streaming whilst developing locally.
 */
export function setStreamDelay(delay = 0) {
  _streamDelay = asSafeInteger(delay);
}

export let _deferredTimeout: number | false = false;
export let _deferredPlaceholder: PlaceholderRenderer | undefined = undefined;
export let _deferredSubstitution: SubstitutionRenderer | undefined = undefined;
export let _streamDelay: number | false = false;

function asSafeInteger(value: unknown): number | false {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : false;
}
