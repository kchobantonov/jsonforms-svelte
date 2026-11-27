import type { UISchemaElement } from '@jsonforms/core';
import { useRendererStyles } from '@chobantonov/jsonforms-svelte-renderer-common';
import { StylesContextSymbol } from '../util/inject';
import { defaultStyles } from './defaultStyles';

export type { Styles } from '@chobantonov/jsonforms-svelte-renderer-common';
export const useStyles = (element?: UISchemaElement) =>
  useRendererStyles(StylesContextSymbol, defaultStyles, element);
