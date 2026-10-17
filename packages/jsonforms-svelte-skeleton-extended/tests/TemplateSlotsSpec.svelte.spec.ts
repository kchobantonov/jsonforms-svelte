import './test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { skeletonRenderers, skeletonCells } from '@chobantonov/jsonforms-svelte-skeleton';
import { skeletonExtendedRenderers } from '../src/lib';
import { createSpecTemplateSlotsExample } from '../../jsonforms-svelte-demo-common/src/lib/examples/spec-template-slots';
import fields from '../../jsonforms-svelte-demo-common/src/lib/examples/spec-template-slots/translations.supplement.json';
import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
afterEach(cleanup);
it.each(['en', 'bg'] as const)(
  'composes canonical named slots and edits the caller data in %s',
  async (locale) => {
    const example = createSpecTemplateSlotsExample(() => locale);
    const onchange = vi.fn();
    render(JsonForms, {
      props: {
        schema: example.schema!,
        uischema: example.uischema!,
        data: structuredClone(example.data),
        uischemas: example.uischemas,
        i18n: example.i18n,
        renderers: [...skeletonExtendedRenderers, ...skeletonRenderers],
        cells: skeletonCells,
        onchange,
      },
    });
    const custom = page.getByRole('textbox', {
      name: fields[locale]['specTemplateSlots.ui.elements.1.elements.1.label'],
      exact: true,
    });
    const fallback = page.getByRole('textbox', {
      name: fields[locale]['specTemplateSlots.registry.0.elements.1.elements.0.label'],
      exact: true,
    });
    await expect.element(custom).toHaveValue((example.data as { name: string }).name);
    await custom.fill('Updated contact');
    (custom.element() as HTMLInputElement).blur();
    await expect.element(fallback).toHaveValue('Updated contact');
    const email = page.getByRole('textbox', {
      name: fields[locale]['specTemplateSlots.ui.elements.3.elements.1.label'],
      exact: true,
    });
    await email.fill('updated@example.org');
    (email.element() as HTMLInputElement).blur();
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data).toEqual({
        ...(example.data as object),
        name: 'Updated contact',
        email: 'updated@example.org',
      }),
    );
    await expect
      .element(
        page.getByText(fields[locale]['specTemplateSlots.registry.1.elements.0.elements.0.text'], {
          exact: true,
        }),
      )
      .toBeVisible();
    expect(
      page
        .getByText(fields[locale]['specTemplateSlots.ui.elements.3.elements.0.text'], {
          exact: true,
        })
        .query(),
    ).toBeNull();
  },
);
