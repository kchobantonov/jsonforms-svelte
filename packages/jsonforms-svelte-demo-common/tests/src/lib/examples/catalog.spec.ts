import { expect, it } from 'vite-plus/test';
import { getExamples } from '@jsonforms/examples';
import { createDemoExamples, filterPublicDemoExamples } from '../../../../src/lib/examples/index';
import catalog from '@chobantonov/jsonforms-extended-spec/examples/catalog.json';
import { examples as sharedExamples } from '@chobantonov/jsonforms-extended-spec/examples';

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
        revision: 'unreleased',
        source: `https://github.com/kchobantonov/jsonforms-extended-spec/tree/main/examples/${entry.id}`,
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

const sourceData = new Map(sharedExamples.map((example) => [example.id, example.data]));
it.each(catalog)('preserves source data and omitted inputs for $id', ({ id, files }) => {
  const example = localizedExamples.find((item) => item.name === `spec-${id}`)!;
  for (const property of ['schema', 'uischema', 'data'] as const)
    if (!files.includes(`${property}.json`)) expect(example, property).not.toHaveProperty(property);
  if (files.includes('data.json')) expect(example.data).toEqual(sourceData.get(id));
});

function sourceFields(actual: unknown, source: unknown): unknown {
  if (Array.isArray(source))
    return source.map((entry, index) => sourceFields((actual as unknown[])[index], entry));
  if (source && typeof source === 'object')
    return Object.fromEntries(
      Object.entries(source).map(([key, value]) => [
        key,
        sourceFields((actual as Record<string, unknown>)[key], value),
      ]),
    );
  return actual;
}

it.each(['flowbite', 'shadcn', 'skeleton'] as const)(
  'preserves active spec repo document fields while adding host localization in %s',
  (family) => {
    const examples = createDemoExamples(family, () => 'en');
    for (const source of sharedExamples) {
      const example = examples.find((item) => item.name === `spec-${source.id}`)!;
      expect(sourceFields(example.schema, source.schema)).toEqual(source.schema);
      const activeUiSchema = source['dynamic-uischema'] ?? source.uischema;
      expect(sourceFields(example.uischema, activeUiSchema)).toEqual(activeUiSchema);
      expect(example.data).toEqual(source.data);
      expect(example.config).toEqual(source.config);
      expect(sourceFields(example.uischemas, source.uischemas)).toEqual(source.uischemas);
    }
  },
);

function uiNodes(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(uiNodes);
  if (!value || typeof value !== 'object') return [];
  const node = value as Record<string, unknown>;
  return [node, ...Object.values(node).flatMap(uiNodes)];
}

it.each(['flowbite', 'shadcn', 'skeleton'] as const)(
  'keeps the native Svelte template separate from the spec fixture in %s',
  (family) => {
    const examples = createDemoExamples(family, () => 'en');
    const source = examples.find((example) => example.name === 'spec-template-layout')!;
    const native = examples.find((example) => example.name === 'native-template-layout')!;
    expect(uiNodes(source.uischema)).not.toEqual(uiNodes(native.uischema));
    expect(
      uiNodes(native.uischema).some(
        (node) =>
          node.type === 'TemplateLayout' &&
          typeof node.template === 'object' &&
          node.template !== null &&
          (node.template as Record<string, unknown>).kind === 'svelte-component' &&
          typeof (node.template as Record<string, unknown>).mount === 'function',
      ),
    ).toBe(true);
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
