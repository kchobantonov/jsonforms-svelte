import { page } from 'vite-plus/test/browser';
import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as categorizationEntry } from '../../src/lib/layouts/CategorizationRenderer.entry';
import { entry as layoutRendererEntry } from '../../src/lib/layouts/LayoutRenderer.entry';
import { getInputByLabel, getTabByText, mountForm, waitForFormChange } from '../testUtils';

describe('CategorizationRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
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

  it('renders category tabs and the first category control when no data is provided', async () => {
    const { view } = await mountForm({ renderers, schema, uischema });

    const text = view.container.textContent ?? '';
    expect(text.includes('General')).toBe(true);
    expect(text.includes('Details')).toBe(true);

    const firstNameInput = getInputByLabel(view.container, 'First Name');
    expect(firstNameInput.value).toBe('');
  });

  it('updates core data after switching tabs and editing data', async () => {
    const { view, onchange } = await mountForm({
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

it('scrolls a long tab strip without moving the form contents out of view', async () => {
  const { view } = await mountForm({
    renderers: [categorizationEntry, layoutRendererEntry, stringControlRendererEntry],
    schema: { type: 'object', properties: { value: { type: 'string', title: 'Visible value' } } },
    data: { value: 'kept in view' },
    uischema: {
      type: 'Categorization',
      elements: Array.from({ length: 12 }, (_, index) => ({
        type: 'Category',
        label: `Long category ${index}`,
        elements: [{ type: 'Control', scope: '#/properties/value' }],
      })),
    },
  });
  view.container.style.width = '320px';
  view.container.style.overflow = 'hidden';
  await page.getByRole('tab', { name: 'Long category 11', exact: true }).click();
  const input = view.container.querySelector<HTMLInputElement>('input');
  expect(input).not.toBeNull();
  const bounds = view.container.getBoundingClientRect();
  const inputBounds = input!.getBoundingClientRect();
  expect(inputBounds.left).toBeGreaterThanOrEqual(bounds.left);
  expect(inputBounds.right).toBeLessThanOrEqual(bounds.right + 1);
  expect(view.container.scrollLeft).toBe(0);
});
