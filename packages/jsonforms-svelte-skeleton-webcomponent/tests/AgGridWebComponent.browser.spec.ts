import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/lib/webcomponent-register.js';

type JsonFormsWebComponentElement = HTMLElement & {
  schema?: string;
  uischema?: string;
  data?: string;
  mode?: string;
  theme?: string;
};

let mountedElement: JsonFormsWebComponentElement | undefined;

afterEach(() => {
  mountedElement?.remove();
  mountedElement = undefined;
  vi.restoreAllMocks();
});

describe('Skeleton AG Grid web component', () => {
  it('renders themed JSON Forms cells inside shadow DOM without pagination warnings', async () => {
    const consoleWarn = vi.spyOn(console, 'warn');
    const element = document.createElement(
      'jsonforms-svelte-skeleton',
    ) as JsonFormsWebComponentElement;
    mountedElement = element;

    element.schema = JSON.stringify({
      type: 'array',
      title: 'People',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', title: 'Name' },
          active: { type: 'boolean', title: 'Active' },
        },
      },
    });
    element.uischema = JSON.stringify({
      type: 'Control',
      scope: '#',
      options: {
        variant: 'ag-grid',
        gridHeight: '260px',
        agGridOptions: {
          pagination: true,
          paginationPageSize: 10,
          paginationPageSizeSelector: [10, 20, 50, 100],
        },
      },
    });
    element.data = JSON.stringify([
      { name: 'Ada', active: true },
      { name: 'Grace', active: false },
    ]);
    element.mode = 'dark';
    element.theme = 'cerberus';
    document.body.append(element);

    await vi.waitFor(
      () => {
        const shadowRoot = element.shadowRoot;
        expect(shadowRoot).not.toBeNull();
        expect(
          shadowRoot?.getElementById('jsonforms-skeleton-ag-grid-runtime-styles'),
        ).not.toBeNull();
        expect(
          shadowRoot?.querySelector('.jsonforms-ag-grid-host')?.getBoundingClientRect().height,
        ).toBeGreaterThan(200);
        const headerLabels = Array.from(shadowRoot?.querySelectorAll('.ag-header-cell') ?? []).map(
          (header) => header.textContent?.trim(),
        );
        expect(headerLabels).toEqual(expect.arrayContaining(['Name', 'Active']));
        expect(shadowRoot?.querySelectorAll('.ag-row')).toHaveLength(2);

        const inputValues = Array.from(shadowRoot?.querySelectorAll('input') ?? []).map(
          (input) => input.value,
        );
        expect(inputValues).toContain('Ada');
        expect(inputValues).toContain('Grace');

        const styledRoot = shadowRoot?.querySelector<HTMLElement>('.ag-styled-root');
        expect(styledRoot).not.toBeNull();
        expect(getComputedStyle(styledRoot!).colorScheme).toBe('dark');
      },
      { timeout: 10_000 },
    );

    const paginationWarnings = consoleWarn.mock.calls.filter(([message]) =>
      /AG Grid: warning #(94|95)/.test(String(message)),
    );
    expect(paginationWarnings).toHaveLength(0);
  });
});
