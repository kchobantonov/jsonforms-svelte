import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

interface DiagnosticRecord {
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
    __validatorDiagnostics?: DiagnosticRecord[];
  }
}

demoTest(
  'web component validator author diagnostic',
  async ({ page, family, base }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(`${base}/${family}/#/examples/spec-choice-controls?use-webcomponent=true`);
    await page.evaluate(async (family) => {
      const tag = `jsonforms-svelte-${family}`;
      await customElements.whenDefined(tag);
      const host = document.createElement(tag);
      host.id = 'validator-diagnostic-host';
      const schema = {
        type: 'object',
        properties: { greeting: { type: 'string' } },
        dynamicDefaults: {
          greeting: { func: 'dynamic', args: { func: '() => "Hello"' } },
        },
      };
      Object.assign(host, {
        schema,
        data: {},
        uischema: { type: 'Control', scope: '#/properties/greeting' },
      });
      window.__validatorDiagnostics = [];
      host.addEventListener('diagnostic', (event) => {
        if (event instanceof CustomEvent) {
          window.__validatorDiagnostics?.push({
            detail: event.detail,
            bubbles: event.bubbles,
            composed: event.composed,
          });
        }
      });
      document.body.append(host);
    }, family);
    await page.waitForFunction(() => window.__validatorDiagnostics?.length === 1);
    const first = await page.evaluate(() => window.__validatorDiagnostics?.[0]);
    expect(first).toEqual({
      detail: {
        code: 'script.evaluationDisabled',
        severity: 'warning',
        message: 'Dynamic default script evaluation is disabled by host policy.',
        details: { capability: 'dynamicDefaults' },
      },
      bubbles: true,
      composed: true,
    });
    const result = await page.evaluate(async () => {
      const host = document.querySelector<HTMLElement>('#validator-diagnostic-host')!;
      Object.assign(host, { data: {} });
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      return {
        count: window.__validatorDiagnostics?.length,
        data: (host as HTMLElement & { data: unknown }).data,
        formText: host.shadowRoot?.textContent,
      };
    });
    expect(result.count).toBe(1);
    expect(result.data).toEqual({});
    expect(result.formText).not.toContain('Dynamic default script evaluation is disabled');
    await page.evaluate(() => {
      const host = document.querySelector<HTMLElement>(
        '#validator-diagnostic-host',
      )! as HTMLElement & {
        schema: unknown;
        uischema: unknown;
      };
      (window as Window & { __invalidValidatorSchema?: unknown }).__invalidValidatorSchema =
        host.schema;
      host.schema = { type: 'object', properties: { greeting: { type: 'string' } } };
      host.uischema = { type: 'Label', text: 'Valid interval' };
    });
    await page.getByText('Valid interval', { exact: true }).waitFor();
    await page.evaluate(() => {
      const host = document.querySelector<HTMLElement>(
        '#validator-diagnostic-host',
      )! as HTMLElement & {
        schema: unknown;
        uischema: unknown;
      };
      host.schema = (
        window as Window & { __invalidValidatorSchema?: unknown }
      ).__invalidValidatorSchema;
      host.uischema = { type: 'Control', scope: '#/properties/greeting' };
    });
    await page.waitForFunction(() => window.__validatorDiagnostics?.length === 2);
    expect(
      await page.evaluate(
        () =>
          (document.querySelector('#validator-diagnostic-host') as HTMLElement & { data: unknown })
            .data,
      ),
    ).toEqual({});
    expect(pageErrors).toEqual([]);
  },
  { locales: ['en'], hosts: ['webcomponent'] },
);
