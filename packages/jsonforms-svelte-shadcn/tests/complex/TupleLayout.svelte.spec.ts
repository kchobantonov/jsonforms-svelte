import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { shadcnCells, shadcnRenderers } from '../../src/lib';
import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';

afterEach(cleanup);
it('keeps omitted positions and their errors while diagnosing invalid layout scopes', async () => {
  const onchange = vi.fn();
  const view = render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: [{ type: 'integer', minimum: 5 }, { type: 'string' }],
        additionalItems: false,
      },
      data: [1, 'Second value'],
      onchange,
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          vertical: true,
          detail: {
            type: 'Group',
            label: 'Authored group',
            elements: [
              { type: 'Control', scope: '#/items/1', label: 'Second' },
              { type: 'Control', scope: '#/items/9' },
              { type: 'Control', scope: '#/properties/0' },
            ],
          },
        },
      },
      renderers: shadcnRenderers,
      cells: shadcnCells,
    },
  });
  await expect
    .element(page.getByRole('textbox', { name: 'Second', exact: true }))
    .toHaveValue('Second value');
  expect(view.container.querySelectorAll('input')).toHaveLength(1);
  expect(view.container.querySelectorAll('[data-tuple-position-diagnostic]')).toHaveLength(2);
  expect(view.container.textContent).toContain('must be >= 5');
  expect(view.container.textContent).toContain('Authored group');
  await page.getByRole('textbox', { name: 'Second', exact: true }).fill('Changed');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual([1, 'Changed']));
});

it('uses a position Control summary and dialog detail independently of the tuple layout', async () => {
  const onchange = vi.fn();
  render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: [
          { type: 'object', properties: { name: { type: 'string' }, desk: { type: 'string' } } },
          { type: 'string' },
        ],
        additionalItems: false,
      },
      data: [{ name: 'Ada', desk: 'Original' }, 'Keep'],
      onchange,
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          detail: {
            type: 'VerticalLayout',
            elements: [
              {
                type: 'Control',
                scope: '#/items/0',
                label: 'Contact',
                options: {
                  summary: { type: 'Control', scope: '#/properties/name' },
                  detail: { type: 'Control', scope: '#/properties/desk', label: 'Desk' },
                },
              },
            ],
          },
        },
      },
      renderers: shadcnRenderers,
      cells: shadcnCells,
    },
  });
  await expect.element(page.getByText('Ada', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit Contact', exact: true }).click();
  const desk = page.getByRole('textbox', { name: 'Desk', exact: true });
  await expect.element(desk).toHaveValue('Original');
  expect(page.getByRole('textbox').all()).toHaveLength(1);
  await desk.fill('Changed');
  await page.getByRole('button', { name: messages.en['composite.apply'], exact: true }).click();
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual([{ name: 'Ada', desk: 'Changed' }, 'Keep']),
  );
});

it('uses tuple-specific orientation defaults and preserves an explicit local false', async () => {
  const view = render(JsonForms, {
    props: {
      schema: { type: 'array', items: [{ type: 'string' }, { type: 'string' }] },
      data: ['First', 'Second'],
      uischema: { type: 'Control', scope: '#' },
      config: { vertical: true, jsonformsExtended: { vertical: true } },
      renderers: shadcnRenderers,
      cells: shadcnCells,
    },
  });
  expect(view.container.querySelector('.tuple-fields.vertical')).toBeNull();
  await view.rerender({ config: { jsonformsExtended: { tuple: { vertical: true } } } });
  expect(view.container.querySelector('.tuple-fields.vertical')).not.toBeNull();
  await view.rerender({ uischema: { type: 'Control', scope: '#', options: { vertical: false } } });
  expect(view.container.querySelector('.tuple-fields.vertical')).toBeNull();
});
