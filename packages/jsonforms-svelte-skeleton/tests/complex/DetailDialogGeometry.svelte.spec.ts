import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { skeletonRenderers } from '../../src/lib/renderers';
import { skeletonCells } from '../../src/lib/cells';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
afterEach(cleanup);

it.each(['en', 'bg'] as const)(
  'keeps native dialog geometry, focus and draft state through maximize/restore in %s',
  async (locale) => {
    await page.viewport(1100, 800);
    const properties = {
      notes: { type: 'string', title: 'Notes' },
      ...Object.fromEntries(
        Array.from({ length: 16 }, (_, index) => [`field${index}`, { type: 'string' }]),
      ),
    };
    const onchange = vi.fn();
    const view = render(JsonForms, {
      props: {
        schema: { type: 'array', items: { type: 'object', properties } } as JsonSchema,
        uischema: {
          type: 'Control',
          scope: '#',
          options: {
            columnDefs: [{ field: 'notes' }],
            rowDetail: {
              presentation: 'dialog',
              dialog: { width: 720, height: 340, draggable: true, resizable: true },
            },
          },
        } as UISchemaElement,
        data: [{ notes: 'Original' }],
        onchange,
        i18n: { locale },
        renderers: skeletonRenderers,
        cells: skeletonCells,
      },
    });
    const open = () =>
      page
        .getByRole('button', {
          name: messages[locale]['collection.editRowDetails'].replace('{index}', '1'),
          exact: true,
        })
        .click();
    await open();
    const surface = page.getByRole('dialog').element() as HTMLElement;
    expect(surface.getAttribute('data-scope')).toBe('dialog');
    expect(surface.getAttribute('data-part')).toBe('content');
    await vi.waitFor(() => expect(Math.round(surface.getBoundingClientRect().width)).toBe(720));
    expect(Math.round(surface.getBoundingClientRect().height)).toBe(340);
    expect(surface.ownerDocument.activeElement).toBe(surface);
    const footer = surface.querySelector('[data-detail-dialog-footer]')!;
    expect(footer.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      surface.getBoundingClientRect().bottom + 1,
    );
    const notes = page.getByRole('textbox', { name: 'Notes', exact: true }).last();
    await notes.fill('Draft preserved');
    await page
      .getByRole('button', { name: messages[locale]['dialog.maximize'], exact: true })
      .click();
    await vi.waitFor(() => expect(Math.round(surface.getBoundingClientRect().height)).toBe(768));
    expect(getComputedStyle(surface).resize).toBe('none');
    await page
      .getByRole('button', { name: messages[locale]['dialog.restore'], exact: true })
      .click();
    await vi.waitFor(() => expect(Math.round(surface.getBoundingClientRect().width)).toBe(720));
    await expect.element(notes).toHaveValue('Draft preserved');
    await page.viewport(600, 450);
    await vi.waitFor(() => expect(surface.getBoundingClientRect().right).toBeLessThanOrEqual(584));
    expect(surface.getBoundingClientRect().left).toBeGreaterThanOrEqual(16);
    await page
      .getByRole('button', { name: messages[locale]['composite.cancel'], exact: true })
      .click();
    await page.viewport(1100, 800);
    await open();
    await expect.element(notes).toHaveValue('Original');
    await vi.waitFor(() =>
      expect(Math.round(page.getByRole('dialog').element().getBoundingClientRect().width)).toBe(
        720,
      ),
    );
    expect(onchange.mock.lastCall?.[0].data).toEqual([{ notes: 'Original' }]);
    await view.rerender({
      config: {
        jsonformsExtended: {
          dialog: { width: 800, height: 600, maximizable: true, draggable: true, resizable: true },
        },
      },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          columnDefs: [{ field: 'notes' }],
          rowDetail: {
            presentation: 'dialog',
            dialog: {
              width: 720,
              height: 340,
              maximizable: false,
              draggable: false,
              resizable: false,
            },
          },
        },
      } as UISchemaElement,
    });
    await vi.waitFor(() =>
      expect(
        page
          .getByRole('button', { name: messages[locale]['dialog.maximize'], exact: true })
          .query(),
      ).toBeNull(),
    );
    const restored = page.getByRole('dialog').element() as HTMLElement;
    expect(Math.round(restored.getBoundingClientRect().width)).toBe(720);
    expect(Math.round(restored.getBoundingClientRect().height)).toBe(340);
    expect(getComputedStyle(restored).resize).toBe('none');
    expect(
      getComputedStyle(restored.querySelector('[data-detail-dialog-header]')!).cursor,
    ).not.toBe('move');
    restored.focus();
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(page.getByRole('dialog').query()).toBeNull());
    await expect
      .element(
        page.getByRole('button', {
          name: messages[locale]['collection.editRowDetails'].replace('{index}', '1'),
          exact: true,
        }),
      )
      .toHaveFocus();
  },
);
