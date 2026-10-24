import './test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { skeletonRenderers, skeletonCells } from '@chobantonov/jsonforms-svelte-skeleton';
import { skeletonExtendedRenderers, skeletonExtendedCells } from '../src/lib';
import { createSpecPresentationExample } from '../../jsonforms-svelte-demo-common/src/lib/examples/spec-presentation';
import fields from '../../jsonforms-svelte-demo-common/src/lib/examples/spec-presentation/translations.supplement.json';
import messages from '../../jsonforms-svelte-demo-common/src/lib/examples/spec-presentation/translations.json';
import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
afterEach(cleanup);
it.each(['en', 'bg'] as const)(
  'renders canonical images, safe links and spacing without writing data in %s',
  async (locale) => {
    const example = createSpecPresentationExample(() => locale);
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: example.schema!,
        data: structuredClone(example.data),
        uischema: example.uischema!,
        config: example.config,
        i18n: example.i18n,
        onchange,
        renderers: [...skeletonExtendedRenderers, ...skeletonRenderers],
        cells: [...skeletonExtendedCells, ...skeletonCells],
      },
    });
    const staticAlt = fields[locale]['specPresentation.ui.elements.1.elements.0.elements.1.alt'];
    const badgeAlt = fields[locale]['specPresentation.ui.elements.1.elements.0.elements.5.alt'];
    await expect.element(page.getByRole('img', { name: staticAlt, exact: true })).toBeVisible();
    await expect.element(page.getByRole('img', { name: badgeAlt, exact: true })).toBeVisible();
    expect(view.container.querySelector('img[alt=""]')).not.toBeNull();
    expect(onchange.mock.lastCall?.[0].data).toEqual(example.data);
    await page
      .getByRole('checkbox', {
        name: fields[locale]['specPresentation.schema.properties.showBanner.label'],
        exact: true,
      })
      .click();
    await vi.waitFor(() =>
      expect(page.getByRole('img', { name: staticAlt, exact: true }).query()).toBeNull(),
    );
    await page
      .getByRole('textbox', {
        name: fields[locale]['specPresentation.schema.properties.badgeImage.label'],
        exact: true,
      })
      .fill('');
    await vi.waitFor(() =>
      expect(page.getByRole('img', { name: badgeAlt, exact: true }).query()).toBeNull(),
    );
    expect(view.container.querySelector('[data-image-diagnostic]')).toBeNull();
    await page
      .getByRole('tab', {
        name: fields[locale]['specPresentation.ui.elements.1.elements.1.label'],
        exact: true,
      })
      .click();
    const docs = page.getByRole('link', {
      name: messages[locale]['jsonformsDocs.label'],
      exact: true,
    });
    await expect.element(docs).toHaveAttribute('target', '_blank');
    expect(docs.element().getAttribute('rel')?.split(/\s+/)).toEqual(
      expect.arrayContaining(['noopener', 'noreferrer']),
    );
    const refused = page.getByText(
      fields[locale]['specPresentation.ui.elements.1.elements.1.elements.6.label'],
      { exact: true },
    );
    await expect.element(refused).toBeVisible();
    expect(refused.element().closest('a')).toBeNull();
    await page
      .getByRole('tab', {
        name: fields[locale]['specPresentation.ui.elements.1.elements.2.label'],
        exact: true,
      })
      .click();
    for (const height of [0, 32, 64])
      expect(view.container.querySelector(`[style*="height: ${height}px"]`)).not.toBeNull();
  },
);
