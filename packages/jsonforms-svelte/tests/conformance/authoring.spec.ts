import { readFile } from 'node:fs/promises';
import Ajv, { type AnySchema } from 'ajv';
import { expect, it } from 'vite-plus/test';
import vectors from '../../../../tests/fixtures/spec-conformance/authoring.json';
import negative from '../../../../tests/fixtures/spec-conformance/expected-invalid.json';
import catalog from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-catalog.json';

const schemas = import.meta.glob<{ $id: string }>(
  '../../../../tests/fixtures/spec-conformance/schemas/*.json',
  { eager: true, import: 'default' },
);
const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: false, $data: true });
for (const schema of Object.values(schemas)) ajv.addSchema(schema);
const check = (name: string) => {
  const schema = Object.entries(schemas).find(([path]) => path.endsWith('/' + name))?.[1];
  if (!schema) throw new Error(`Missing authoring schema: ${name}`);
  return ajv.getSchema(schema.$id)!;
};
it.each(vectors)('canonical authoring: $id', ({ schema, value, valid }) => {
  const validate = check(schema);
  expect(validate(value), ajv.errorsText(validate.errors)).toBe(valid);
});

async function readExample(id: string, file: string): Promise<unknown> {
  const url = new URL(
    `../../../jsonforms-svelte-demo-common/src/lib/examples/spec-${id}/${file}`,
    import.meta.url,
  );
  return JSON.parse(await readFile(url, 'utf8'));
}
function replacePointer(value: unknown, pointer: string, replacement: unknown) {
  const keys = pointer
    .slice(1)
    .split('/')
    .map((key) => key.replaceAll('~1', '/').replaceAll('~0', '~'));
  let parent = value;
  for (const key of keys.slice(0, -1)) {
    if (!parent || typeof parent !== 'object' || !Object.hasOwn(parent, key))
      throw new Error(`Missing fixture pointer: ${pointer}`);
    parent = (parent as Record<string, unknown>)[key];
  }
  if (!parent || typeof parent !== 'object') throw new Error(`Invalid fixture pointer: ${pointer}`);
  Object.defineProperty(parent, keys.at(-1)!, {
    value: replacement,
    writable: true,
    enumerable: true,
    configurable: true,
  });
}
it.each(catalog)('canonical example authoring: $id', async (entry) => {
  expect(check('example.schema.json')(entry)).toBe(true);
  for (const file of entry.files.filter((name) =>
    ['schema.json', 'uischema.json', 'config.json', 'uischemas.json'].includes(name),
  )) {
    const value = await readExample(entry.id, file);
    if (file === 'schema.json') {
      expect(
        ajv.validateSchema(value as AnySchema),
        `${entry.id}/${file}: ${ajv.errorsText()}`,
      ).toBe(true);
      continue;
    }
    const validate = check(
      file === 'config.json'
        ? 'jsonforms-extended-config.schema.json'
        : 'jsonforms-extended-uischema.schema.json',
    );
    if (file === 'uischemas.json') {
      for (const item of value as { uischema: unknown }[])
        expect(
          validate(item.uischema),
          `${entry.id}/${file}: ${ajv.errorsText(validate.errors)}`,
        ).toBe(true);
      continue;
    }
    const exceptions = negative.filter((item) => item.example === entry.id && item.file === file);
    if (exceptions.length) {
      expect(validate(value)).toBe(false);
      const errors = structuredClone(validate.errors ?? []);
      for (const item of exceptions) {
        expect(
          errors.some(
            (error) =>
              error.instancePath === item.pointer ||
              error.instancePath.startsWith(item.pointer + '/'),
          ),
          item.reason,
        ).toBe(true);
        replacePointer(value, item.pointer, item.replacement);
      }
    }
    expect(validate(value), `${entry.id}/${file}: ${ajv.errorsText(validate.errors)}`).toBe(true);
  }
});
