import {
  and,
  or,
  formatIs,
  optionIs,
  isStringControl,
  rankWith,
  type JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import renderer from './CronControlRenderer.svelte';
export const entry: JsonFormsRendererRegistryEntry = {
  renderer,
  tester: rankWith(3, and(isStringControl, or(formatIs('cron'), optionIs('format', 'cron')))),
};
