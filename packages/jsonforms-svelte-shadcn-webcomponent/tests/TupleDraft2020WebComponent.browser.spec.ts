import { afterEach, expect, it, vi } from 'vite-plus/test';
import Ajv2020 from 'ajv/dist/2020';
import '../src/lib/webcomponent-register.js';

let element: HTMLElement | undefined;
afterEach(() => element?.remove());

it('uses a host-supplied Draft 2020-12 validator for a forbidden tuple tail', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: {
      value: {
        type: 'array',
        prefixItems: [{ type: 'number' }, { type: 'number' }],
        items: false,
      },
    },
  };
  Object.assign(element, {
    schema,
    data: { value: [1, 2, 'legacy'] },
    ajv: new Ajv2020({ strict: false, allErrors: true }),
  });
  const changes = vi.fn();
  element.addEventListener('change', (event) => {
    if (event instanceof CustomEvent) changes(event.detail);
  });
  document.body.append(element);

  const root = () => element!.shadowRoot!;
  await vi.waitFor(() => {
    expect(root().querySelector('[data-additional-items-errors]')).not.toBeNull();
    expect(root().querySelector<HTMLButtonElement>('button[aria-label="Add item"]')?.disabled).toBe(
      true,
    );
    expect(root().querySelector('[data-additional-item="2"]')).not.toBeNull();
    expect(
      changes.mock.calls.some(([change]) =>
        change.errors?.some(
          (error: { keyword: string; instancePath: string }) =>
            error.keyword === 'items' && error.instancePath === '/value',
        ),
      ),
    ).toBe(true);
  });

  root().querySelector<HTMLButtonElement>('button[aria-label="Delete Item 3"]')!.click();
  await vi.waitFor(() => {
    expect(
      changes.mock.calls.some(
        ([change]) => JSON.stringify(change.data?.value) === JSON.stringify([1, 2]),
      ),
    ).toBe(true);
    expect(root().querySelector('[data-additional-items-errors]')).toBeNull();
  });
});

it('revalidates when the host replaces the validator instance', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  const initial = new Ajv2020({ strict: false, allErrors: true });
  initial.addFormat('host-check', { type: 'string', validate: () => true });
  const replacement = new Ajv2020({ strict: false, allErrors: true });
  replacement.addFormat('host-check', { type: 'string', validate: () => false });
  Object.assign(element, {
    schema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: { label: { type: 'string', format: 'host-check' } },
    },
    data: { label: 'review' },
    ajv: initial,
  });
  const changes = vi.fn();
  element.addEventListener('change', (event) => {
    if (event instanceof CustomEvent) changes(event.detail);
  });
  document.body.append(element);
  await vi.waitFor(() => expect(changes.mock.lastCall?.[0].errors).toEqual([]));
  Object.assign(element, { ajv: replacement });
  await vi.waitFor(() =>
    expect(changes.mock.lastCall?.[0].errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ keyword: 'format', instancePath: '/label' }),
      ]),
    ),
  );
});
