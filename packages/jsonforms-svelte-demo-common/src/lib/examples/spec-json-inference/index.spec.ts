import { expect, it } from 'vitest';
import { createSpecJsonInferenceExample } from './index';
import { createSpecJsonEditorExample } from '../spec-json-editor';

it('preserves absent schema/data while distinguishing the explicit generic schema', () => {
  let locale = 'en';
  const inferred = createSpecJsonInferenceExample(() => locale);
  const generic = createSpecJsonEditorExample(() => locale);
  expect(Object.hasOwn(inferred, 'schema')).toBe(false);
  expect(Object.hasOwn(inferred, 'data')).toBe(false);
  expect(Object.hasOwn(generic, 'data')).toBe(false);
  expect(generic.schema).toEqual({});
  expect(inferred.i18n?.translate?.('json-inference.value.label', '')).toBe('JSON value');
  locale = 'bg';
  expect(inferred.i18n?.translate?.('json-inference.value.label', '')).toBe('JSON стойност');
  expect(inferred.schema).toBeUndefined();
  expect(inferred.data).toBeUndefined();
});
