import '../test.css';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { render, cleanup } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { shadcnRenderers, shadcnCells } from '../../src/lib';
import { createSpecArrayControlsExample } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls';
import translations from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.json';
import supplement from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.supplement.json';

afterEach(cleanup);
it.each(['en', 'bg'] as const)(
  'edits canonical table cells with localized columns in %s',
  async (locale) => {
    const example = createSpecArrayControlsExample(() => locale);
    const onchange = vi.fn();
    render(JsonForms, {
      props: {
        schema: example.schema!,
        uischema: example.uischema!,
        data: structuredClone(example.data),
        config: example.config,
        i18n: example.i18n,
        renderers: shadcnRenderers,
        cells: shadcnCells,
        onchange,
      },
    });
    const panel = page.getByRole('tabpanel', {
      name: translations[locale]['tableTab.label'],
      exact: true,
    });
    const titleLabel =
      supplement[locale][
        'specArrayControls.schema.properties.sessions.items.properties.title.label'
      ];
    await expect
      .element(panel.getByRole('columnheader', { name: titleLabel, exact: false }))
      .toBeVisible();
    const row = panel.getByRole('row').nth(1);
    const title = row.getByRole('textbox').first();
    await expect.element(title).toHaveValue('Designing for the second read');
    expect(row.element().textContent).toContain('Aurora');
    const design =
      supplement[locale][
        'specArrayControls.schema.properties.sessions.items.properties.track.oneOf.1.label'
      ];
    const choice = row.getByText(design, { exact: true });
    await vi.waitFor(() => {
      const element = choice.element();
      const displayed =
        element instanceof HTMLSelectElement
          ? element.selectedOptions[0]?.textContent
          : element instanceof HTMLInputElement
            ? element.value
            : element.textContent;
      expect(displayed?.trim()).toBe(design);
    });
    await title.fill('Updated conference session');
    await panel.getByRole('columnheader', { name: titleLabel, exact: false }).click();
    const expected = structuredClone(example.data) as { sessions: { title: string }[] };
    expected.sessions[0].title = 'Updated conference session';
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(expected));
    const room =
      supplement[locale][
        'specArrayControls.schema.properties.sessions.items.properties.room.label'
      ];
    await row
      .getByRole('button', {
        name: messages[locale]['composite.edit'].replace('{label}', room),
        exact: true,
      })
      .click();
    await expect.element(page.getByRole('dialog', { name: room, exact: true })).toBeVisible();
    await page
      .getByRole('dialog', { name: room, exact: true })
      .getByRole('button', { name: messages[locale]['composite.close'], exact: true })
      .click();
    expect(onchange.mock.lastCall?.[0].data).toEqual(expected);
  },
);
