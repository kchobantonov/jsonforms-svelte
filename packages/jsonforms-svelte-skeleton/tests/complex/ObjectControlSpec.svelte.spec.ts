import '../test.css';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { render, cleanup } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { skeletonRenderers, skeletonCells } from '../../src/lib';
import { createSpecObjectControlExample } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-object-control';
import translations from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-object-control/translations.json';
import supplement from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-object-control/translations.supplement.json';

afterEach(cleanup);
it.each(['en', 'bg'] as const)(
  'resolves canonical object detail forms and preserves sibling data in %s',
  async (locale) => {
    const example = createSpecObjectControlExample(() => locale);
    const onchange = vi.fn();
    render(JsonForms, {
      props: {
        schema: example.schema!,
        uischema: example.uischema!,
        data: structuredClone(example.data),
        config: example.config,
        i18n: example.i18n,
        uischemas: example.uischemas,
        renderers: skeletonRenderers,
        cells: skeletonCells,
        onchange,
      },
    });
    const field = (path: string) =>
      page.getByRole('textbox', {
        name: supplement[locale][
          `specObjectControl.schema.properties.${path}.label` as keyof typeof supplement.en
        ],
        exact: false,
      });
    await expect.element(field('identity.properties.legalName')).toBeVisible();
    expect(
      page
        .getByRole('textbox', {
          name: messages[locale]['additionalProperties.propertyNameLabel'],
          exact: true,
        })
        .query(),
    ).toBeNull();
    expect(onchange.mock.lastCall?.[0].data).toEqual(example.data);
    await page
      .getByRole('tab', { name: translations[locale]['features.detail.label'], exact: true })
      .click();
    const phone = field('contact.properties.phone');
    const email = field('contact.properties.email');
    await expect.element(phone).toBeVisible();
    expect(
      phone.element().compareDocumentPosition(email.element()) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    await phone.fill('+359 2 111 1111');
    await page
      .getByRole('tab', { name: translations[locale]['features.registry.label'], exact: true })
      .click();
    const street = field('address.properties.line1');
    const postcode = field('address.properties.postcode');
    const city = field('address.properties.city');
    await expect.element(street).toBeVisible();
    expect(
      street.element().compareDocumentPosition(postcode.element()) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      postcode.element().compareDocumentPosition(city.element()) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    const contact = field('handover.properties.contactName');
    const window = field('handover.properties.window');
    const gate = field('handover.properties.gateCode');
    expect(
      contact.element().compareDocumentPosition(window.element()) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      window.element().compareDocumentPosition(gate.element()) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    await expect.element(field('notes.properties.forCoordinator')).toBeVisible();
    // Current React accepts this legacy bare-elements detail; the canonical README differs.
    expect(field('notes.properties.forOffice').query()).toBeNull();
    await page
      .getByRole('tab', { name: translations[locale]['features.validation.label'], exact: true })
      .click();
    const directError = page.getByRole('img', {
      name: translations[locale]['error.minProperties'],
      exact: true,
    });
    await expect.element(directError).toBeVisible();
    expect(directError.element().closest('h3')?.textContent).toContain(
      supplement[locale]['specObjectControl.schema.properties.preferences.label'],
    );
    expect(directError.element().getAttribute('data-error-count')).toBeNull();
    await field('preferences.properties.language').fill('bg');
    await field('preferences.properties.timezone').click();
    await vi.waitFor(() => expect(directError.query()).toBeNull());
    const rejected = page.getByRole('img', {
      name: `"legacyZone": ${translations[locale]['error.additionalProperties']}`,
      exact: true,
    });
    await expect.element(rejected).toBeVisible();
    expect(onchange.mock.lastCall?.[0].data.routing.legacyZone).toBeDefined();
    await page
      .getByRole('button', {
        name: messages[locale]['additionalProperties.removeAriaLabel'],
        exact: true,
      })
      .click();
    await vi.waitFor(() => expect(rejected.query()).toBeNull());
    const expected = structuredClone(example.data) as {
      contact: { phone: string };
      preferences: { language?: string };
      routing: Record<string, unknown>;
    };
    expected.contact.phone = '+359 2 111 1111';
    expected.preferences.language = 'bg';
    delete expected.routing.legacyZone;
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(expected));
    for (const [section, staticCount, additionalCount] of [
      ['static', 2, 0],
      ['dynamic', 0, 2],
      ['mixed', 2, 2],
    ] as const) {
      const label = translations[locale][`objectFrame.${section}.label`];
      await page.getByRole('tab', { name: label, exact: true }).click();
      const panel = page.getByRole('tabpanel', { name: label, exact: true });
      expect(panel.element().querySelectorAll('[data-object-static-fields]')).toHaveLength(
        staticCount,
      );
      const additional = [...panel.element().querySelectorAll('[data-additional-properties]')];
      expect(additional).toHaveLength(additionalCount);
      for (const element of additional) {
        expect(element.getAttribute('data-embedded')).toBe('true');
        expect(getComputedStyle(element).borderTopWidth).toBe('0px');
      }
    }
    expect(onchange.mock.lastCall?.[0].data).toEqual(expected);
  },
);
