import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

interface ImageDiagnosticRecord {
  detail: {
    code: string;
    severity: string;
    message: string;
    details?: Record<string, unknown>;
  };
  bubbles: boolean;
  composed: boolean;
}

declare global {
  interface Window {
    __imageDiagnostics?: ImageDiagnosticRecord[];
  }
}

demoTest(
  'web component image URL author diagnostic',
  async ({ page, family, base }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(`${base}/${family}/#/examples/spec-presentation?use-webcomponent=true`);
    await page.evaluate(async (family) => {
      const tag = `jsonforms-svelte-${family}`;
      await customElements.whenDefined(tag);
      const host = document.createElement(tag);
      host.id = 'image-diagnostic-host';
      Object.assign(host, {
        schema: { type: 'object', properties: { label: { type: 'string' } } },
        data: { label: 'retained' },
        uischema: { type: 'ImageView', src: 'javascript:alert(1)', alt: 'Example image' },
      });
      window.__imageDiagnostics = [];
      host.addEventListener('diagnostic', (event) => {
        if (event instanceof CustomEvent && event.detail.code === 'image.urlRefused') {
          window.__imageDiagnostics?.push({
            detail: event.detail,
            bubbles: event.bubbles,
            composed: event.composed,
          });
        }
      });
      document.body.append(host);
    }, family);
    const host = page.locator('#image-diagnostic-host');
    const warningCount = () => page.evaluate(() => window.__imageDiagnostics?.length ?? 0);
    const blockedImageCount = () =>
      host.evaluate(
        (element) =>
          element.shadowRoot?.querySelectorAll('[data-image-diagnostic="image.urlRefused"]')
            .length ?? 0,
      );
    await expect.poll(warningCount).toBe(1);
    expect(await page.evaluate(() => window.__imageDiagnostics?.[0])).toEqual({
      detail: {
        code: 'image.urlRefused',
        severity: 'error',
        message:
          'The image source is blocked by the configured URL policy. Use an allowed image URL or adjust the image URL policy.',
        details: { path: '', scope: undefined },
      },
      bubbles: true,
      composed: true,
    });
    expect(await blockedImageCount()).toBe(1);
    expect(await host.evaluate((element) => element.shadowRoot?.textContent)).not.toContain(
      'javascript:',
    );
    await host.evaluate((element) => {
      (element as HTMLElement & { data: unknown }).data = { label: 'retained' };
    });
    expect(await warningCount()).toBe(1);
    await host.evaluate((element) => {
      (element as HTMLElement & { uischema: unknown }).uischema = {
        type: 'ImageView',
        src: 'https://example.com/image.png',
        alt: 'Example image',
      };
    });
    await expect.poll(blockedImageCount).toBe(0);
    await host.evaluate((element) => {
      (element as HTMLElement & { uischema: unknown }).uischema = {
        type: 'ImageView',
        src: 'javascript:alert(1)',
        alt: 'Example image',
      };
    });
    await expect.poll(warningCount).toBe(2);
    expect(await blockedImageCount()).toBe(1);
    expect(
      await host.evaluate((element) => (element as HTMLElement & { data: unknown }).data),
    ).toEqual({
      label: 'retained',
    });
    expect(pageErrors).toEqual([]);
  },
  { locales: ['en'], hosts: ['webcomponent'] },
);
