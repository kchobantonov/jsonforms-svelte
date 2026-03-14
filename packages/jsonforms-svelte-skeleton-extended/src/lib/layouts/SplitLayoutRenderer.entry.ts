import {
  and,
  or,
  rankWith,
  uiTypeIs,
  type JsonFormsRendererRegistryEntry,
  type UISchemaElement,
} from '@jsonforms/core';
import splitLayoutRenderer from './SplitLayoutRenderer.svelte';

const splitLayoutVariant = 'splitter';

const hasSplitLayoutVariant = (uischema: UISchemaElement): boolean => {
  const variant = (uischema as { options?: { variant?: unknown } }).options?.variant;
  return typeof variant === 'string' && variant.toLowerCase() === splitLayoutVariant;
};

const isSplitLayout = and(
  or(uiTypeIs('HorizontalLayout'), uiTypeIs('VerticalLayout')),
  hasSplitLayoutVariant,
);

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: splitLayoutRenderer,
  tester: rankWith(5, isSplitLayout),
};
