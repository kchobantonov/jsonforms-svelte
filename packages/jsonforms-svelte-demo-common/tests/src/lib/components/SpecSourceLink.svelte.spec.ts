import { afterEach, expect, it } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import SpecSourceLink from '../../../../src/lib/components/SpecSourceLink.svelte';
import messages from '../../../../src/lib/components/demo-messages.json';

afterEach(cleanup);

it('exposes exact catalog host requirements in both demo locales', async () => {
  const requirement = 'Apply the declarative match rules from uischemas.json.';
  const spec = {
    id: 'array-detail-modes',
    revision: 'test',
    source: 'https://example.com/spec',
    hostRequirements: [requirement],
  };
  const view = await render(SpecSourceLink, { props: { spec, locale: 'en' } });
  await expect
    .element(page.getByRole('link', { name: messages.en['spec.source'] }))
    .toHaveAttribute('href', spec.source);
  await expect.element(page.getByText(requirement)).not.toBeVisible();
  await page.getByText(messages.en['spec.hostRequirements']).click();
  await expect.element(page.getByText(requirement)).toBeVisible();

  await view.rerender({ locale: 'bg' });
  await expect.element(page.getByText(messages.bg['spec.hostRequirements'])).toBeVisible();
  await expect.element(page.getByText(requirement)).toBeVisible();
});

it('omits the disclosure when the catalog declares no host requirements', async () => {
  const view = await render(SpecSourceLink, {
    props: {
      spec: {
        id: 'boolean-controls',
        revision: 'test',
        source: 'https://example.com/spec',
        hostRequirements: [],
      },
      locale: 'en',
    },
  });
  expect(view.container.querySelector('[data-host-requirements]')).toBeNull();
});
