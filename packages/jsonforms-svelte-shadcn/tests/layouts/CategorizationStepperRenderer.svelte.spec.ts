import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as categorizationStepperEntry } from '../../src/lib/layouts/CategorizationStepperRenderer.entry';
import { entry as layoutRendererEntry } from '../../src/lib/layouts/LayoutRenderer.entry';
import { getButtonByText, getInputByLabel, mountForm, waitForFormChange } from '../testUtils';

describe('CategorizationStepperRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [categorizationStepperEntry, layoutRendererEntry, stringControlRendererEntry];

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
    options: {
      variant: 'stepper',
      showNavButtons: true,
    },
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

  it('renders first step and navigation buttons when no data is provided', () => {
    const { view } = mountForm({ renderers, schema, uischema });
    const text = view.container.textContent ?? '';

    expect(text.includes('General')).toBe(true);
    expect(text.includes('Details')).toBe(true);

    const previousButton = getButtonByText(view.container, 'Previous');
    const nextButton = getButtonByText(view.container, 'Next');
    expect(previousButton.disabled).toBe(true);
    expect(nextButton.disabled).toBe(false);

    const firstNameInput = getInputByLabel(view.container, 'First Name');
    expect(firstNameInput.value).toBe('');
  });

  it('moves to next step and updates core data', async () => {
    const { view, onchange } = mountForm({
      renderers,
      schema,
      uischema,
      data: { firstName: 'Ada', lastName: 'Lovelace' },
    });

    const nextButton = getButtonByText(view.container, 'Next');
    nextButton.click();
    await vi.waitFor(() => {
      expect(nextButton.disabled).toBe(true);
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
