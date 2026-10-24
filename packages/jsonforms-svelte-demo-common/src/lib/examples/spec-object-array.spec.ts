import { createAjv } from '@jsonforms/core';
import { describe, expect, it } from 'vite-plus/test';
import { findDetailUISchema } from '@chobantonov/jsonforms-svelte';
import type { ControlElement, JsonSchema, Layout } from '@jsonforms/core';
import { createSpecObjectControlExample } from './spec-object-control';
import { createSpecArrayControlsExample } from './spec-array-controls';
import objectData from './spec-object-control/data.json';
import arrayData from './spec-array-controls/data.json';
import { uischemas } from './spec-object-control/uischemas';

describe('canonical object and array examples', () => {
  it.each(['en', 'bg'])(
    'localizes choice values and custom errors in %s without rewriting data',
    (locale) => {
      const object = createSpecObjectControlExample(() => locale);
      const array = createSpecArrayControlsExample(() => locale);
      expect(object.data).toEqual(objectData);
      expect(array.data).toEqual(arrayData);
      const ajv = createAjv();
      expect(ajv.validateSchema(object.schema!)).toBe(true);
      expect(ajv.validateSchema(array.schema!)).toBe(true);
      const track = array.schema!.properties!.sessions.items as JsonSchema;
      const choice = track.properties!.track.oneOf![0] as JsonSchema & { i18n: string };
      expect(array.i18n!.translate!(choice.i18n, choice.title)).toBe(
        locale === 'bg' ? 'Инженерство' : 'Engineering',
      );
      expect(array.i18n!.translate!('arrayControls.reviewers.label', 'Reviewers')).toBe(
        locale === 'bg' ? 'Рецензенти' : 'Reviewers',
      );
      expect(array.i18n!.translate!('arrayControls.reviewers.error.contains', '')).toContain(
        locale === 'bg' ? 'Водещ' : 'Lead',
      );
    },
  );

  it('preserves registry identities and GENERATE precedence', () => {
    const example = createSpecObjectControlExample(() => 'bg');
    const schema = example.schema!;
    const resolve = (key: string, detail?: unknown) =>
      findDetailUISchema(
        uischemas,
        schema.properties![key],
        `#/properties/${key}`,
        key,
        undefined,
        { type: 'Control', scope: `#/properties/${key}`, options: { detail } } as ControlElement,
        schema,
      ) as Layout;
    expect(schema.properties!.address.title).toBe('Address');
    expect(resolve('address')).toBe(uischemas[0].uischema);
    expect(resolve('handover')).toBe(uischemas[1].uischema);
    expect((resolve('handover', 'GENERATE').elements[0] as ControlElement).scope).toBe(
      '#/properties/contactName',
    );
  });
});
