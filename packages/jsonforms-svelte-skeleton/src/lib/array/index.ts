import {
  and,
  uiTypeIs,
  rankWith,
  schemaTypeIs,
  type JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import { ArrayLayoutRenderer } from '../layouts';

export const arrayListRendererEntry: JsonFormsRendererRegistryEntry = {
  renderer: ArrayLayoutRenderer,
  tester: rankWith(2, and(uiTypeIs('Control'), schemaTypeIs('array'))),
};

export const arrayRenderers = [arrayListRendererEntry];
