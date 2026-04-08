/**
 * Vanilla Extract mock for Vitest --environment node.
 *
 * VE's real style() / globalStyle() require a build-pipeline context
 * that doesn't exist in a node test environment.  These stubs return
 * stable identifiers so that any component importing a .css.ts file
 * still gets a usable (non-null) string for className comparisons.
 */

let counter = 0;

export const style = (_rules?: object): string => `_ve_${counter++}`;

export const globalStyle = (_selector: string, _rules: object): void => {};

export const keyframes = (_definition: object): string => `_kf_${counter++}`;

export const createGlobalTheme = (_selector: string, _tokens: object): void => {};

export const createTheme = (_tokens: object): [string, unknown] => [`_theme_${counter++}`, {}];

export const createVar = (): string => `--_ve_${counter++}`;

export const fallbackVar = (varRef: string, _fallback: string): string => varRef;

export const assignVars = (_map: object, _tokens: object): object => ({});

export const fontFace = (_definition: object): string => `_ff_${counter++}`;

export const layer = (..._names: string[]): string => `_layer_${counter++}`;
