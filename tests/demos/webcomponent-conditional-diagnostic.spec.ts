import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

interface ConditionalDiagnosticRecord {
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
    __conditionalDiagnostics?: ConditionalDiagnosticRecord[];
  }
}

demoTest(
  'web component conditional-reference author diagnostic',
  async ({ page, family, base }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(`${base}/${family}/#/examples/spec-conditional-fields?use-webcomponent=true`);
    await page.evaluate(async (family) => {
      const tag = `jsonforms-svelte-${family}`;
      await customElements.whenDefined(tag);
      const host = document.createElement(tag);
      host.id = 'conditional-diagnostic-host';
      const invalidSchema = {
        type: 'object',
        properties: {
          value: {
            type: 'object',
            properties: { kind: { type: 'string' } },
            allOf: [{ $ref: '#/definitions/Branch' }],
          },
        },
      };
      Object.assign(host, {
        schema: invalidSchema,
        data: { value: { kind: 'business' } },
        validationMode: 'NoValidation',
        uischema: {
          type: 'Control',
          scope: '#/properties/value',
          options: { conditionalFields: true },
        },
      });
      window.__conditionalDiagnostics = [];
      host.addEventListener('diagnostic', (event) => {
        if (event instanceof CustomEvent && event.detail.code === 'conditional.referenceFailed') {
          window.__conditionalDiagnostics?.push({
            detail: event.detail,
            bubbles: event.bubbles,
            composed: event.composed,
          });
        }
      });
      document.body.append(host);
    }, family);
    await page.waitForFunction(() => window.__conditionalDiagnostics?.length === 1);
    expect(await page.evaluate(() => window.__conditionalDiagnostics?.[0])).toEqual({
      detail: {
        code: 'conditional.referenceFailed',
        severity: 'warning',
        message: 'A conditional field reference could not be resolved.',
        details: { path: 'value' },
      },
      bubbles: true,
      composed: true,
    });
    const host = page.locator('#conditional-diagnostic-host');
    const visibleText = () => host.evaluate((element) => element.shadowRoot?.textContent ?? '');
    await expect.poll(visibleText).toContain('could not be resolved');
    await host.evaluate((element) => {
      (element as HTMLElement & { data: unknown }).data = { value: { kind: 'business' } };
    });
    expect(await page.evaluate(() => window.__conditionalDiagnostics?.length)).toBe(1);
    await host.evaluate((element) => {
      (element as HTMLElement & { schema: unknown }).schema = {
        type: 'object',
        definitions: {
          Branch: {
            if: { properties: { kind: { const: 'business' } }, required: ['kind'] },
            then: { properties: { vat: { type: 'string' } } },
          },
        },
        properties: {
          value: {
            type: 'object',
            properties: { kind: { type: 'string' } },
            allOf: [{ $ref: '#/definitions/Branch' }],
          },
        },
      };
    });
    await expect.poll(visibleText).not.toContain('could not be resolved');
    await host.evaluate((element) => {
      (element as HTMLElement & { schema: unknown }).schema = {
        type: 'object',
        properties: {
          value: {
            type: 'object',
            properties: { kind: { type: 'string' } },
            allOf: [{ $ref: '#/definitions/Branch' }],
          },
        },
      };
    });
    await page.waitForFunction(() => window.__conditionalDiagnostics?.length === 2);
    expect(
      await host.evaluate((element) => (element as HTMLElement & { data: unknown }).data),
    ).toEqual({
      value: { kind: 'business' },
    });
    expect(pageErrors).toEqual([]);
  },
  { locales: ['en'], hosts: ['webcomponent'] },
);
