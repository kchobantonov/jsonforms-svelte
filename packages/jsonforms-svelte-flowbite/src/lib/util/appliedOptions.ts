import type { CommonInputOptions } from '@chobantonov/jsonforms-svelte-renderer-common';
import type { Options } from './options';

export type { MaskTokenOptions, VendorProps } from '@chobantonov/jsonforms-svelte-renderer-common';
export type AppliedOptions = Omit<Options, 'step'> & CommonInputOptions;
