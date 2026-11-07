import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { shadcnCells, shadcnRenderers } from '@chobantonov/jsonforms-svelte-shadcn';
import type { ControlElement, JsonSchema } from '@jsonforms/core';
import { describe, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import { isAgGridRendererRuntimeRequested, shadcnExtendedRenderers } from '../src/lib';

describe('AG Grid array renderer', () => {
  it('retranslates the short child notice and counts only when enabled', async () => {
    const data = [{ name: 'x' }];
    const hostError = {
      instancePath: '/0/name',
      schemaPath: '#/host',
      keyword: 'host',
      params: {},
      message: 'Host fallback',
    };
    const view = await render(JsonForms, {
      props: {
        data,
        additionalErrors: [hostError],
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: { name: { type: 'string', minLength: 3, title: 'Name' } },
          },
        },
        uischema: {
          type: 'Control',
          scope: '#',
          options: {
            variant: 'ag-grid',
            showValidationIndicator: true,
            showValidationIndicatorCount: true,
          },
        },
        renderers: [...shadcnRenderers, ...shadcnExtendedRenderers],
        cells: shadcnCells,
        i18n: {
          locale: 'en',
          translateError: (error: { keyword: string }) =>
            error.keyword === 'host' ? 'Host English' : 'Document English',
        },
      },
    });
    const notice = () => view.container.querySelector<HTMLElement>('[data-array-summary]');
    await expect
      .poll(() => notice()?.querySelector('[data-array-summary-message]')?.textContent?.trim())
      .toBe('2 errors in items.');
    expect(notice()?.textContent).not.toContain('Document English');
    expect(notice()?.textContent).not.toContain('Host English');
    expect(document.querySelector('[data-error-summary]')).toBeNull();
    await view.rerender({
      i18n: {
        locale: 'bg',
        translateError: (error: { keyword: string }) =>
          error.keyword === 'host' ? 'Грешка от сървъра' : 'Грешка в документа',
      },
    });
    await expect
      .poll(() => notice()?.querySelector('[data-array-summary-message]')?.textContent?.trim())
      .toBe('2 грешки в елементите.');
    await view.rerender({ validationMode: 'ValidateAndHide' });
    await expect
      .poll(() => notice()?.querySelector('[data-array-summary-message]')?.textContent?.trim())
      .toBe('1 грешка в елементите.');
    await view.rerender({ validationMode: 'NoValidation' });
    expect(notice()?.querySelector('[data-array-summary-message]')?.textContent?.trim()).toBe(
      '1 грешка в елементите.',
    );
    await view.rerender({ additionalErrors: [] });
    await expect.poll(notice).toBeNull();
    expect(data).toEqual([{ name: 'x' }]);
  });

  it('loads only when selected and renders JSON Forms cells inside the grid', async () => {
    const renderers = [...shadcnRenderers, ...shadcnExtendedRenderers];
    const runtimeRequestedBeforeOrdinaryControl = isAgGridRendererRuntimeRequested();
    const view = await render(JsonForms, {
      props: {
        data: 'ordinary value',
        schema: { type: 'string', title: 'Ordinary field' },
        uischema: { type: 'Control', scope: '#' },
        renderers,
        cells: shadcnCells,
      },
    });

    await expect.element(page.getByText('Ordinary field')).toBeInTheDocument();
    expect(isAgGridRendererRuntimeRequested()).toBe(runtimeRequestedBeforeOrdinaryControl);

    const schema: JsonSchema = {
      type: 'array',
      title: 'People',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', title: 'Name' },
          active: { type: 'boolean', title: 'Active' },
        },
      },
    };
    const uischema: ControlElement = {
      type: 'Control',
      scope: '#',
      options: { variant: 'ag-grid', height: '260px' },
    };

    await view.rerender({
      data: [
        { name: 'Ada', active: true },
        { name: 'Grace', active: false },
      ],
      schema,
      uischema,
      renderers,
      cells: shadcnCells,
    });

    await vi.waitFor(() => expect(isAgGridRendererRuntimeRequested()).toBe(true));
    await vi.waitFor(() => {
      expect(document.querySelector('[data-jsonforms-ag-grid]')).not.toBeNull();
      expect(document.querySelector('.ag-root')).not.toBeNull();

      const inputValues = Array.from(document.querySelectorAll('input')).map(
        (input) => input.value,
      );
      expect(inputValues).toEqual(expect.arrayContaining(['Ada', 'Grace']));
    });
  });
});
