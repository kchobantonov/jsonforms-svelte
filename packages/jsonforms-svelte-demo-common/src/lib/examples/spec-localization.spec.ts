import { expect, it } from 'vite-plus/test';
import { localizeSpecDocument } from './spec-localization';

it('annotates copied schema/UI text while preserving trusted titles and explicit prefixes', () => {
  const document = {
    type: 'Group',
    label: 'Example',
    elements: [
      { type: 'Label', text: 'Explanation' },
      { type: 'Control', scope: '#/properties/value', i18n: '' },
    ],
    definitions: {
      value: { title: 'Registry identity', i18n: 'existing', items: [{ title: 'Position' }] },
    },
  };
  const snapshot = structuredClone(document);
  const localized = localizeSpecDocument(document, 'fixture') as typeof document & { i18n: string };
  expect(document).toEqual(snapshot);
  expect(localized.i18n).toBe('fixture');
  expect(localized.elements[0].i18n).toBe('fixture.elements.0');
  expect(localized.elements[1].i18n).toBe('');
  expect(localized.definitions.value.title).toBe('Registry identity');
  expect(localized.definitions.value.i18n).toBe('existing');
});

it('uses exact translation keys for constant choices and keeps host-authored keys', () => {
  const schema = {
    oneOf: [
      { const: 'eng', title: 'Engineering' },
      { const: false, title: 'No', i18n: 'host.no' },
      { const: null, title: 'None' },
    ],
  };
  const localized = localizeSpecDocument(schema, 'choices');
  expect(localized.oneOf[0]).toEqual({
    const: 'eng',
    title: 'Engineering',
    i18n: 'choices.oneOf.0.label',
  });
  expect(localized.oneOf[1].i18n).toBe('host.no');
  expect(localized.oneOf[2]).toEqual({ const: null, title: 'None', i18n: 'choices.oneOf.2.label' });
  expect(schema.oneOf[0]).not.toHaveProperty('i18n');
});

it('does not annotate property dictionaries whose keys are title or description', () => {
  const schema = {
    type: 'object',
    properties: {
      title: { type: 'string', title: 'Heading' },
      description: { type: 'string', description: 'Help' },
    },
  };
  const localized = localizeSpecDocument(schema, 'fixture');
  expect(localized.properties).not.toHaveProperty('i18n');
  expect(localized.properties.title).toHaveProperty('i18n', 'fixture.properties.title');
  expect(localized.properties.description).toHaveProperty('i18n', 'fixture.properties.description');
});
