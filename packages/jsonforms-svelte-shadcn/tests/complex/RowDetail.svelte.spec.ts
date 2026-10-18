import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { shadcnRenderers } from '../../src/lib/renderers';
import { shadcnCells } from '../../src/lib/cells';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
afterEach(cleanup);

it.each(['en', 'bg'] as const)(
  'edits whole-row drafts independently of visible columns in %s',
  async (locale) => {
    const data = [{ name: 'Ada', notes: 'Hidden note', untouched: 'keep' }];
    const onchange = vi.fn();
    const view = render(JsonForms, {
      props: {
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              notes: { type: 'string' },
              untouched: { type: 'string' },
            },
          },
        } as JsonSchema,
        uischema: {
          type: 'Control',
          scope: '#',
          options: {
            columnDefs: [{ field: 'name' }],
            rowDetail: {
              presentation: 'dialog',
              detail: {
                type: 'Control',
                scope: '#/properties/notes',
                label: 'Notes',
              },
            },
          },
        } as UISchemaElement,
        data,
        renderers: shadcnRenderers,
        cells: shadcnCells,
        onchange,
        i18n: { locale },
      },
    });
    const open = () =>
      page
        .getByRole('button', {
          name: messages[locale]['collection.editRowDetails'].replace('{index}', '1'),
          exact: true,
        })
        .click();
    const notes = page.getByRole('textbox', { name: 'Notes', exact: true });
    const apply = page.getByRole('button', {
      name: messages[locale]['composite.apply'],
      exact: true,
    });
    const cancel = page.getByRole('button', {
      name: messages[locale]['composite.cancel'],
      exact: true,
    });
    await open();
    await notes.fill('Discarded');
    await cancel.click();
    expect(onchange.mock.lastCall?.[0].data).toEqual(data);
    await open();
    await expect.element(notes).toHaveValue('Hidden note');
    await notes.fill('Committed');
    await apply.click();
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data).toEqual([
        { name: 'Ada', notes: 'Committed', untouched: 'keep' },
      ]),
    );
    await open();
    await notes.fill('Stale');
    const replacement = [{ name: 'Grace', notes: 'External', untouched: 'keep' }];
    await view.rerender({ data: replacement });
    await expect.element(apply).toBeDisabled();
    await cancel.click();
    await view.rerender({ readonly: true });
    await open();
    await expect.element(notes).toHaveValue('External');
    await expect.element(notes).toBeDisabled();
    await expect.element(apply).toBeDisabled();
    await cancel.click();
    expect(onchange.mock.lastCall?.[0].data).toEqual(replacement);
  },
);

it.each(['right', 'bottom'] as const)(
  'retains panel selection, edits and pane sizes with %s placement',
  async (placement) => {
    const data = Array.from({ length: 6 }, (_, index) => ({
      name: `Person ${index}`,
      notes: `Note ${index}`,
    }));
    const onchange = vi.fn();
    const view = render(JsonForms, {
      props: {
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: { name: { type: 'string' }, notes: { type: 'string' } },
          },
        } as JsonSchema,
        uischema: {
          type: 'Control',
          scope: '#',
          options: {
            columnDefs: [{ field: 'name' }],
            rowDetail: {
              presentation: 'panel',
              placement,
              collapsed: true,
              detail: { type: 'Control', scope: '#/properties/notes', label: 'Notes' },
            },
          },
        } as UISchemaElement,
        data,
        renderers: shadcnRenderers,
        cells: shadcnCells,
        onchange,
      },
    });
    await page.getByRole('textbox').first().click();
    const actions = view.container.querySelector('[data-array-actions]')!;
    const buttons = actions.querySelectorAll('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].getAttribute('aria-label')).toBe(messages.en['collection.showDetails']);
    const toggleBounds = buttons[0].getBoundingClientRect();
    const addBounds = buttons[1].getBoundingClientRect();
    expect(addBounds.left - toggleBounds.right).toBeGreaterThanOrEqual(0);
    expect(addBounds.left - toggleBounds.right).toBeLessThanOrEqual(12);
    expect(
      Math.abs(addBounds.top + addBounds.height / 2 - toggleBounds.top - toggleBounds.height / 2),
    ).toBeLessThan(2);
    expect(view.container.querySelector('[data-row-detail-content]')).toBeNull();
    await page
      .getByRole('button', { name: messages.en['collection.showDetails'], exact: true })
      .click();
    const notes = page.getByRole('textbox', { name: 'Notes', exact: true });
    await expect.element(notes).toHaveValue('Note 0');
    expect(view.container.querySelector('tbody tr')?.getAttribute('aria-current')).toBe('true');
    const handle = page.getByRole('separator', {
      name: messages.en['collection.resizeDetails'],
      exact: true,
    });
    const element = handle.element();
    element.focus();
    const before = element.getAttribute('aria-valuenow');
    element.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: placement === 'right' ? 'ArrowRight' : 'ArrowDown',
        bubbles: true,
      }),
    );
    await vi.waitFor(() => expect(element.getAttribute('aria-valuenow')).not.toBe(before));
    const resized = element.getAttribute('aria-valuenow');
    await notes.fill('Edited note');
    await page
      .getByRole('button', { name: messages.en['collection.hideDetails'], exact: true })
      .click();
    expect(view.container.querySelector('tbody [aria-current="true"]')).toBeNull();
    await page
      .getByRole('button', { name: messages.en['collection.showDetails'], exact: true })
      .click();
    await expect.element(notes).toHaveValue('Edited note');
    expect(handle.element().getAttribute('aria-valuenow')).toBe(resized);
    await page.getByRole('button', { name: messages.en['collection.next'], exact: true }).click();
    await expect.element(notes).toHaveValue('Edited note');
    await page
      .getByRole('button', {
        name: messages.en['collection.editRowDetails'].replace('{index}', '6'),
        exact: true,
      })
      .click();
    await expect.element(notes).toHaveValue('Note 5');
    await view.rerender({ readonly: true });
    await expect.element(notes).toBeDisabled();
    expect(onchange.mock.lastCall?.[0].data[0].notes).toBe('Edited note');
    expect(onchange.mock.lastCall?.[0].data[5].notes).toBe('Note 5');
  },
);

it.each(['right', 'bottom'] as const)(
  'scrolls tall row details inside the %s pane',
  async (placement) => {
    const properties = Object.fromEntries(
      Array.from({ length: 16 }, (_, index) => [`field${index}`, { type: 'string' }]),
    );
    const view = render(JsonForms, {
      props: {
        schema: { type: 'array', items: { type: 'object', properties } },
        uischema: {
          type: 'Control',
          scope: '#',
          options: {
            columnDefs: [{ field: 'field0' }],
            rowDetail: {
              presentation: 'panel',
              placement,
              detail: {
                type: 'VerticalLayout',
                elements: Object.keys(properties).map((key) => ({
                  type: 'Control',
                  scope: `#/properties/${key}`,
                  label: key,
                })),
              },
            },
          },
        } as UISchemaElement,
        data: [Object.fromEntries(Object.keys(properties).map((key) => [key, key]))],
        renderers: shadcnRenderers,
        cells: shadcnCells,
      },
    });
    await page
      .getByRole('textbox')
      .first()
      .click({ position: { x: 5, y: 5 } });
    const scroll = view.container.querySelector<HTMLElement>('[data-row-detail-scroll]')!;
    const panel = view.container.querySelector<HTMLElement>('[data-row-detail-panel]')!;
    await expect.poll(() => scroll.scrollHeight > scroll.clientHeight).toBe(true);
    expect(getComputedStyle(scroll).overflowY).toBe('auto');
    const panelHeight = panel.getBoundingClientRect().height;
    const last = scroll.querySelector<HTMLInputElement>('input[id*="field15"]')!;
    last.focus();
    await expect.poll(() => scroll.scrollTop).toBeGreaterThan(0);
    const bounds = last.getBoundingClientRect();
    const viewport = scroll.getBoundingClientRect();
    expect(bounds.top).toBeGreaterThanOrEqual(viewport.top);
    expect(bounds.bottom).toBeLessThanOrEqual(viewport.bottom);
    expect(panel.getBoundingClientRect().height).toBe(panelHeight);
  },
);
