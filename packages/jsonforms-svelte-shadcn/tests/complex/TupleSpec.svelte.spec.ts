import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { shadcnCells, shadcnRenderers } from '../../src/lib';
import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createSpecTupleControlExample } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-tuple-control';
import translations from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-tuple-control/translations.json';
import supplement from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-tuple-control/translations.supplement.json';
import original from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-tuple-control/data.json';

afterEach(cleanup);
it.each(['en', 'bg'] as const)(
  'edits canonical tuples without changing sibling positions or normalizing invalid imports in %s',
  async (locale) => {
    const example = createSpecTupleControlExample(() => locale);
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: example.schema as JsonSchema,
        uischema: example.uischema as UISchemaElement,
        data: structuredClone(example.data),
        uischemas: example.uischemas,
        i18n: example.i18n,
        renderers: shadcnRenderers,
        cells: shadcnCells,
        onchange,
      },
    });
    const tab = (key: keyof typeof translations.en) =>
      (
        page
          .getByRole('tab', { name: translations[locale][key], exact: true })
          .element() as HTMLElement
      ).click();
    const east = page.getByRole('spinbutton', {
      name: translations[locale]['coordinates.x.label'],
      exact: true,
    });
    await expect.element(east).toHaveValue(45.52);
    await east.fill('46');
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data.coordinates).toEqual([46, -122.68]),
    );
    expect(onchange.mock.lastCall![0].data.dimensions).toEqual([120, 80, -5]);
    expect(onchange.mock.lastCall![0].data.orderLine).toEqual([]);
    const latitude = page.getByRole('spinbutton', {
      name: supplement[locale]['tupleExample.schema.properties.survey.items.0.label'],
      exact: true,
    });
    const longitude = page.getByRole('spinbutton', {
      name: supplement[locale]['tupleExample.schema.properties.survey.items.1.label'],
      exact: true,
    });
    expect((longitude.element() as HTMLElement).compareDocumentPosition(latitude.element())).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    await latitude.fill('47');
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data.survey).toEqual([47, -122.6819, 15.2]),
    );
    tab('featureNavigation.section2.label');
    await page
      .getByRole('spinbutton', {
        name: supplement[locale]['tupleExample.schema.properties.orderLine.items.1.label'],
        exact: true,
      })
      .fill('3');
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.orderLine).toEqual(['', 3]));
    expect(onchange.mock.lastCall![0].data.inspection).toEqual(original.inspection);
    tab('featureNavigation.section3.label');
    await expect
      .element(page.getByText(translations[locale]['tuple.configuration'], { exact: true }))
      .toBeVisible();
    expect(view.container.textContent).toContain('1200 NW Naito Parkway');
    expect(view.container.textContent).toContain('A. Ferreira');
    const deleteLabel = translations[locale]['tuple.delete'].replace(
      '{label}',
      translations[locale]['tuple.position'].replace('{position}', '3'),
    );
    await page.getByRole('button', { name: deleteLabel, exact: true }).click();
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data.legacyAssignment).toEqual(['LEG-01', 3]),
    );
    expect(onchange.mock.lastCall![0].data.projectContact).toEqual(original.projectContact);
    expect(onchange.mock.lastCall![0].data.handoffContacts).toEqual(original.handoffContacts);
  },
);
