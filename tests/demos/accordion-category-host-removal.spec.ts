import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'focused accordion Category host removal',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.stack ?? error.message));
    await page.goto(`${base}/${family}/#/examples/spec-categorization?use-webcomponent=true`);

    const ui = {
      type: 'Categorization',
      options: { variant: 'accordion' },
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
    await page.evaluate(
      async ({ family, ui }) => {
        const tag = `jsonforms-svelte-${family}`;
        await customElements.whenDefined(tag);
        const host = document.createElement(tag);
        host.id = 'accordion-host-removal';
        host.style.cssText =
          'position:fixed;z-index:9999;top:80px;left:300px;width:500px;background:white;';
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
      },
      { family, ui },
    );

    const host = page.locator('#accordion-host-removal');
    const general = host.getByRole('button', { name: 'General', exact: false });
    if ((await general.getAttribute('aria-expanded')) !== 'true') await general.click();
    await expect.poll(() => general.getAttribute('aria-expanded')).toBe('true');
    await general.focus();
    await host.evaluate((element, schema) => {
      element.setAttribute(
        'uischema',
        JSON.stringify({ ...schema, elements: schema.elements.slice(1) }),
      );
    }, ui);
    const place = host.getByRole('button', { name: 'Place', exact: false });
    await expect.poll(() => general.count()).toBe(0);
    await expect.poll(() => place.getAttribute('aria-expanded')).toBe('true');
    await expect
      .poll(() =>
        place.evaluate(
          (element) =>
            element.getRootNode() instanceof ShadowRoot &&
            (element.getRootNode() as ShadowRoot).activeElement === element,
        ),
      )
      .toBe(true);
    await expect
      .poll(() => host.getByRole('textbox', { name: 'City' }).inputValue())
      .toBe('Boston');
    expect(await host.getAttribute('data')).toBe(JSON.stringify({ name: 'Ada', city: 'Boston' }));
    expect(pageErrors).toEqual([]);
  },
  { hosts: ['webcomponent'], timeout: 30000 },
);
