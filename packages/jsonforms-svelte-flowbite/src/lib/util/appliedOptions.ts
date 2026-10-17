import type { MaskInputOptions, MaskTokens } from 'maska';
import type { HTMLAttributes } from 'svelte/elements';
import type { Options } from './options';

/** Existing renderer options; unknown extension keys remain available to consumers. */
export interface AppliedOptions extends Omit<Options, 'step'>, Record<string, unknown> {
  placeholder?: string;
  restrict?: boolean;
  clearable?: boolean;
  step?: number | string;
  mask?: MaskInputOptions['mask'] | boolean;
  maskReplacers?: MaskTokenOptions;
  tokens?: MaskTokenOptions;
}

export type MaskTokenOptions = Record<
  string,
  | string
  | (Omit<MaskTokens[string], 'pattern'> & { pattern: string | RegExp })
  | false
  | null
  | undefined
>;

/** Dynamic vendor paths may target different components; only class is merged here. */
export type VendorProps<T extends object = Record<never, never>> = Record<string, unknown> & {
  class?: Extract<HTMLAttributes<HTMLElement>['class'], string | null> | string[];
} & Partial<T>;
