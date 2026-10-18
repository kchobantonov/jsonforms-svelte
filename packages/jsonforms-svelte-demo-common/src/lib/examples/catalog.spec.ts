import { expect, it } from 'vitest';
import { getExamples } from '@jsonforms/examples';
import { createDemoExamples, filterPublicDemoExamples } from './index';
import catalog from './spec-catalog.json';
import provenance from './spec-provenance.json';

it.each(['flowbite', 'shadcn', 'skeleton'] as const)(
  'registers every generated spec entry once without replacing existing demos in %s',
  (family) => {
    let locale = 'en';
    const examples = createDemoExamples(family, () => locale);
    const spec = examples.filter((example) => example.name.startsWith('spec-'));
    expect(spec.map((example) => example.name).sort()).toEqual(
      catalog.map((entry) => `spec-${entry.id}`).sort(),
    );
    expect(new Set(examples.map((example) => example.name)).size).toBe(examples.length);
    expect(examples.some((example) => example.name === 'ag-grid')).toBe(true);
    for (const entry of catalog) {
      const example = spec.find((example) => example.name === `spec-${entry.id}`)!;
      expect(example.label).toBe(`Spec: ${entry.title}`);
      expect(example.spec).toEqual({
        id: entry.id,
        revision: provenance.revision,
        source: provenance.imported.find((source) => source.id === entry.id)!.source,
        hostRequirements: entry.hostRequirements,
      });
    }
    const job = spec.find((example) => example.name === 'spec-kitchen-sink')!;
    expect(job.i18n?.translate?.('firstName.label', '')).toBe('First name');
    locale = 'bg';
    expect(job.i18n?.translate?.('firstName.label', '')).toBe('Име');
  },
);

const localizedExamples = createDemoExamples('flowbite', () => 'en');
const parameters = (text: string) =>
  [
    ...new Set([...text.matchAll(/\$?\{\s*([A-Za-z_$][\w$]*)\s*\}/g)].map((match) => match[1])),
  ].sort();

function constantChoiceKeys(schema: unknown): string[] {
  if (!schema || typeof schema !== 'object') return [];
  if (Array.isArray(schema)) return schema.flatMap(constantChoiceKeys);
  const node = schema as Record<string, unknown>;
  const keys = Object.hasOwn(node, 'const') && typeof node.i18n === 'string' ? [node.i18n] : [];
  for (const keyword of [
    'properties',
    'patternProperties',
    'definitions',
    '$defs',
    'dependentSchemas',
  ]) {
    const dictionary = node[keyword];
    if (dictionary && typeof dictionary === 'object')
      keys.push(...Object.values(dictionary).flatMap(constantChoiceKeys));
  }
  for (const keyword of [
    'oneOf',
    'anyOf',
    'allOf',
    'items',
    'prefixItems',
    'additionalItems',
    'additionalProperties',
    'contains',
    'not',
    'if',
    'then',
    'else',
  ]) {
    keys.push(...constantChoiceKeys(node[keyword]));
  }
  return keys;
}

it.each(catalog)('keeps EN/BG message keys and parameters aligned for $id', ({ id }) => {
  const example = localizedExamples.find((item) => item.name === `spec-${id}`)!;
  const translations = example.i18n?.translations as Record<string, Record<string, unknown>>;
  expect(translations).toBeDefined();
  expect(translations.en).toBeDefined();
  expect(translations.bg).toBeDefined();
  for (const key of constantChoiceKeys(example.schema)) {
    for (const locale of ['en', 'bg'])
      expect(
        Object.hasOwn(translations[locale], key),
        `${id}/${locale}: exact choice key ${key}`,
      ).toBe(true);
  }
  expect(Object.keys(translations.bg).sort()).toEqual(Object.keys(translations.en).sort());
  for (const key of Object.keys(translations.en)) {
    const en = translations.en[key];
    const bg = translations.bg[key];
    expect(typeof bg, key).toBe(typeof en);
    if (typeof en === 'string' && typeof bg === 'string')
      expect(parameters(bg), key).toEqual(parameters(en));
  }
});

const sourceData = import.meta.glob('./spec-*/data.json', { eager: true, import: 'default' });
it.each(catalog)('preserves source data and omitted inputs for $id', ({ id, files }) => {
  const example = localizedExamples.find((item) => item.name === `spec-${id}`)!;
  for (const property of ['schema', 'uischema', 'data'] as const)
    if (!files.includes(`${property}.json`)) expect(example, property).not.toHaveProperty(property);
  if (files.includes('data.json'))
    expect(example.data).toEqual(sourceData[`./spec-${id}/data.json`]);
});

const registries = import.meta.glob<{
  uischemas: import('@jsonforms/core').JsonFormsUISchemaRegistryEntry[];
}>('./spec-*/uischemas.ts', { eager: true });
it.each(Object.entries(registries))(
  'retains trusted registry entries from %s across families and locale changes',
  (path, module) => {
    const name = path.split('/')[1];
    for (const family of ['flowbite', 'shadcn', 'skeleton'] as const) {
      let locale = 'en';
      const example = createDemoExamples(family, () => locale).find((item) => item.name === name)!;
      expect(example.uischemas).toEqual(module.uischemas);
      for (const entry of example.uischemas ?? []) expect(typeof entry.tester).toBe('function');
      const registry = example.uischemas;
      locale = 'bg';
      expect(example.i18n?.locale).toBe('bg');
      expect(example.uischemas).toBe(registry);
    }
  },
);

it.each(['flowbite', 'shadcn', 'skeleton'] as const)(
  'separates spec and original examples while retaining development routes in %s',
  (family) => {
    const examples = createDemoExamples(family, () => 'en');
    const spec = filterPublicDemoExamples(examples);
    expect(spec).toHaveLength(catalog.length);
    expect(spec.every((example) => example.spec)).toBe(true);
    const originals = filterPublicDemoExamples(examples, 'jsonforms');
    expect(originals.map((example) => example.name).sort()).toEqual(
      getExamples()
        .map((example) => `jsonforms-${example.name}`)
        .sort(),
    );
    expect(originals.every((example) => example.label.startsWith('JsonForms: '))).toBe(true);
    const all = filterPublicDemoExamples(examples, 'all');
    expect(all).toHaveLength(spec.length + originals.length);
    expect(all.some((example) => example.name === 'main')).toBe(false);
    expect(examples.some((example) => example.name === 'main')).toBe(true);
    expect(
      filterPublicDemoExamples(examples, 'spec', '  CRON ').map((example) => example.name),
    ).toEqual(['spec-cron-control']);
  },
);
