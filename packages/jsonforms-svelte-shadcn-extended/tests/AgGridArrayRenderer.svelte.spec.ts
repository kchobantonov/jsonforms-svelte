import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { isAgGridRendererRuntimeRequested } from '@chobantonov/jsonforms-svelte-ag-grid';
import { shadcnCells, shadcnRenderers } from '@chobantonov/jsonforms-svelte-shadcn';
import type { ControlElement, JsonSchema } from '@jsonforms/core';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { shadcnExtendedRenderers } from '../src/lib';

describe('AG Grid array renderer', () => {
  it('loads only when selected and renders JSON Forms cells inside the grid', async () => {
    const renderers = [...shadcnRenderers, ...shadcnExtendedRenderers];
    const runtimeRequestedBeforeOrdinaryControl = isAgGridRendererRuntimeRequested();
    const view = render(JsonForms, {
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
      options: { variant: 'ag-grid', gridHeight: '260px' },
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
