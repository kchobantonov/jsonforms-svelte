import { expect, it } from 'vite-plus/test';
import { restoreTrustedUISchemaTesters, serializeUISchemaRegistry } from './uischemaRegistryEditor';

it('shows and retains an unchanged trusted tester through a JSON editor round trip', () => {
  const tester = (schema: { title?: string }) => (schema.title === 'Address' ? 10 : -1);
  const original = [{ tester, uischema: { type: 'Control', scope: '#/properties/street' } }];
  const text = serializeUISchemaRegistry(original);
  const edited = JSON.parse(text) as {
    tester: string;
    uischema: { type: string; scope: string };
  }[];
  expect(edited[0].tester).toBe(tester.toString());
  edited[0].uischema.scope = '#/properties/city';
  const restored = restoreTrustedUISchemaTesters(edited, original)!;
  expect(restored[0].tester).toBe(tester);
  expect(restored[0].uischema.scope).toBe('#/properties/city');
});

it('leaves changed and originally authored string testers subject to runtime permission', () => {
  const tester = () => 10;
  const original = [{ tester, uischema: { type: 'Control' } }];
  const edited = [{ tester: '() => -1', uischema: { type: 'Control' } }];
  expect(restoreTrustedUISchemaTesters(edited, original)).toEqual(edited);
  expect(restoreTrustedUISchemaTesters(edited, edited)).toEqual(edited);
  expect(serializeUISchemaRegistry(undefined)).toBe('');
});
