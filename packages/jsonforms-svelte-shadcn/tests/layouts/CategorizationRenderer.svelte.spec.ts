import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as categorizationEntry } from '../../src/lib/layouts/CategorizationRenderer.entry';
import { entry as layoutRendererEntry } from '../../src/lib/layouts/LayoutRenderer.entry';
import { getInputByLabel, getTabByText, mountForm, waitForFormChange } from '../testUtils';

describe('CategorizationRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [categorizationEntry, layoutRendererEntry, stringControlRendererEntry];

  const schema = {
    type: 'object',
    properties: {
      firstName: {
        type: 'string',
        title: 'First Name',
      },
      lastName: {
        type: 'string',
        title: 'Last Name',
      },
    },
  } as JsonSchema;

  const uischema = {
    type: 'Categorization',
    elements: [
      {
        type: 'Category',
        label: 'General',
        elements: [
          {
            type: 'Control',
            scope: '#/properties/firstName',
          },
        ],
      },
      {
        type: 'Category',
        label: 'Details',
        elements: [
          {
            type: 'Control',
            scope: '#/properties/lastName',
          },
        ],
      },
    ],
  } as UISchemaElement;

  it('renders category tabs and the first category control when no data is provided', () => {
    const { view } = mountForm({ renderers, schema, uischema });

    const text = view.container.textContent ?? '';
    expect(text.includes('General')).toBe(true);
    expect(text.includes('Details')).toBe(true);

    const firstNameInput = getInputByLabel(view.container, 'First Name');
    expect(firstNameInput.value).toBe('');
  });

  it('updates core data after switching tabs and editing data', async () => {
    const { view, onchange } = mountForm({
      renderers,
      schema,
      uischema,
      data: { firstName: 'Ada', lastName: 'Lovelace' },
    });

    const detailsTab = getTabByText(view.container, 'Details');
    detailsTab.click();

    await vi.waitFor(() => {
      expect(detailsTab.getAttribute('aria-selected')).toBe('true');
    });

    const lastNameInput = getInputByLabel(view.container, 'Last Name');
    expect(lastNameInput.value).toBe('Lovelace');

    const before = onchange.mock.calls.length;
    lastNameInput.value = 'Byron';
    lastNameInput.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForFormChange(onchange, before);

    expect(changeEvent.data.lastName).toBe('Byron');
  });
});
