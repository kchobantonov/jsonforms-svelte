import { expect, it } from 'vitest';
import vectors from '../../../../tests/fixtures/spec-conformance/behavior.json';
import { isAllowedUrl } from '../../src/lib/urlPolicy';
import { confirmationRequired, type ConfirmationPolicy } from '../../src/lib/confirmation';
import { containerErrorIndex } from '../../src/lib/containerValidation';
import { selectedEnumId } from '../../src/lib/enumChoices';

const vector = (id: string) => {
  const found = vectors.find((entry) => entry.id === id);
  if (!found) throw new Error(`Missing canonical behavior vector: ${id}`);
  return found;
};

it('url-script', () => {
  const { input, expected } = vector('url-script');
  expect(isAllowedUrl(input.url)).toBe(expected.allowed);
});
it('confirmation-complex-old', () => {
  const { input, expected } = vector('confirmation-complex-old');
  expect(confirmationRequired(input.policy as ConfirmationPolicy, [input.old])).toBe(
    expected.confirm,
  );
});
it('array-error-boundary', () => {
  const { input, expected } = vector('array-error-boundary');
  const index = containerErrorIndex([
    {
      instancePath: '/' + input.errorPath!.replaceAll('.', '/'),
      keyword: 'type',
      schemaPath: '#/type',
      params: {},
    },
  ]);
  expect(index.has('/' + input.container!.replaceAll('.', '/'))).toBe(expected.contributes);
});
it('port-choice-reload', () => {
  const { input, expected } = vector('port-choice-reload');
  const data = JSON.parse(JSON.stringify(input.data));
  const choices = input.schema!.enum!.map((value) => ({ value, label: JSON.stringify(value) }));
  expect(selectedEnumId(choices, data)).toBe(`choice-${expected.selectedChoiceIndex}`);
  expect(typeof data).toBe(expected.storedValueType);
  expect(data).toEqual(input.data);
});
