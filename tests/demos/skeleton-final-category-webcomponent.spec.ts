import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'skeleton focused Category removal',
  async ({ page, base }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${base}/skeleton/#/examples/spec-categorization?use-webcomponent=true`);
    for (const variant of ['tabs', 'accordion', 'stepper'] as const) {
      const ui = {
        type: 'Categorization',
        options: variant === 'tabs' ? {} : { variant },
        elements: [
          {
            type: 'Category',
            name: 'general',
            label: 'General',
            elements: [{ type: 'Control', scope: '#/properties/name' }],
          },
        ],
      };
      await page.evaluate(
        async ({ variant, schema }) => {
          await customElements.whenDefined('jsonforms-svelte-skeleton');
          const host = document.createElement('jsonforms-svelte-skeleton');
          host.id = `final-category-${variant}`;
          host.style.cssText =
            'position:fixed;z-index:9999;top:80px;left:300px;width:500px;background:white;';
          host.setAttribute(
            'schema',
            JSON.stringify({
              type: 'object',
              properties: { name: { type: 'string', title: 'Name' } },
            }),
          );
          host.setAttribute('uischema', JSON.stringify(schema));
          host.setAttribute('data', JSON.stringify({ name: 'Ada' }));
          document.body.append(host);
        },
        { variant, schema: ui },
      );
      const host = page.locator(`#final-category-${variant}`);
      const trigger =
        variant === 'stepper'
          ? host.locator('[data-scope="steps"][data-part="trigger"]')
          : host.getByRole(variant === 'tabs' ? 'tab' : 'button', { name: 'General' });
      await trigger.focus();
      await host.evaluate((element, schema) => {
        element.setAttribute('uischema', JSON.stringify({ ...schema, elements: [] }));
      }, ui);
      await expect.poll(() => host.locator('input').count()).toBe(0);
      await host.evaluate((element, schema) => {
        element.setAttribute('uischema', JSON.stringify(schema));
      }, ui);
      await expect.poll(() => host.getByRole('textbox', { name: 'Name' }).inputValue()).toBe('Ada');
    }
    const twoCategories = {
      type: 'Categorization',
      elements: [
        {
          type: 'Category',
          name: 'general',
          label: 'General',
          elements: [{ type: 'Control', scope: '#/properties/name' }],
        },
        {
          type: 'Category',
          name: 'place',
          label: 'Place',
          elements: [{ type: 'Control', scope: '#/properties/city' }],
        },
      ],
    };
    await page.evaluate(async (ui) => {
      await customElements.whenDefined('jsonforms-svelte-skeleton');
      const host = document.createElement('jsonforms-svelte-skeleton');
      host.id = 'first-category-removal';
      host.style.cssText =
        'position:fixed;z-index:9999;top:80px;left:850px;width:500px;background:white;';
      host.setAttribute(
        'schema',
        JSON.stringify({
          type: 'object',
          properties: {
            name: { type: 'string', title: 'Name' },
            city: { type: 'string', title: 'City' },
          },
        }),
      );
      host.setAttribute('uischema', JSON.stringify(ui));
      host.setAttribute('data', JSON.stringify({ name: 'Ada', city: 'Boston' }));
      document.body.append(host);
    }, twoCategories);
    const firstHost = page.locator('#first-category-removal');
    await firstHost.getByRole('tab', { name: 'General' }).focus();
    await firstHost.evaluate((element, ui) => {
      element.setAttribute('uischema', JSON.stringify({ ...ui, elements: ui.elements.slice(1) }));
    }, twoCategories);
    const place = firstHost.getByRole('tab', { name: 'Place' });
    await expect.poll(() => place.getAttribute('aria-selected')).toBe('true');
    await expect
      .poll(() =>
        place.evaluate((element) => {
          const root = element.getRootNode();
          return root instanceof ShadowRoot && root.activeElement === element;
        }),
      )
      .toBe(true);
    await expect.poll(() => firstHost.getByRole('tab', { name: 'General' }).count()).toBe(0);
    await expect
      .poll(() => firstHost.getByRole('textbox', { name: 'City' }).inputValue())
      .toBe('Boston');
    expect(errors).toEqual([]);
  },
  { families: ['skeleton'], hosts: ['webcomponent'], timeout: 30000 },
);
