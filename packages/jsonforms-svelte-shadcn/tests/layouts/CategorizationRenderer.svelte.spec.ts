import { userEvent } from 'vite-plus/test/browser';
import { clearAllIds, RuleEffect, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as categorizationEntry } from '../../src/lib/layouts/CategorizationRenderer.entry';
import { entry as accordionEntry } from '../../src/lib/layouts/CategorizationAccordionRenderer.entry';
import { entry as stepperEntry } from '../../src/lib/layouts/CategorizationStepperRenderer.entry';
import { entry as layoutRendererEntry } from '../../src/lib/layouts/LayoutRenderer.entry';
import { getInputByLabel, getTabByText, mountForm, waitForFormChange } from '../testUtils';
import '../test.css';

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

  it('selects tabs by default and for unknown variants, and selects authored alternatives', () => {
    const rank = (entry: typeof categorizationEntry, variant?: string) =>
      entry.tester({ ...uischema, options: variant ? { variant } : undefined }, schema, {
        rootSchema: schema,
        config: {},
      });
    expect(rank(categorizationEntry)).toBe(2);
    expect(rank(accordionEntry)).toBe(-1);
    expect(rank(stepperEntry)).toBe(-1);
    expect(rank(categorizationEntry, 'custom')).toBe(2);
    expect(rank(accordionEntry, 'custom')).toBe(-1);
    expect(rank(stepperEntry, 'custom')).toBe(-1);
    expect(rank(accordionEntry, 'accordion')).toBe(3);
    expect(rank(stepperEntry, 'stepper')).toBe(3);
  });

  it('renders category tabs and the first category control when no data is provided', async () => {
    const { view } = await mountForm({ renderers, schema, uischema });

    const text = view.container.textContent ?? '';
    expect(text.includes('General')).toBe(true);
    expect(text.includes('Details')).toBe(true);

    const firstNameInput = getInputByLabel(view.container, 'First Name');
    expect(firstNameInput.value).toBe('');
  });

  it('keeps a visible empty category and removes only categories hidden by their own rule', async () => {
    const [general, details] = (uischema as UISchemaElement & { elements: UISchemaElement[] })
      .elements;
    const hiddenWhen = (property: string) => ({
      effect: RuleEffect.HIDE,
      condition: { scope: `#/properties/${property}`, schema: { const: true } },
    });
    const conditional = {
      type: 'Categorization',
      options: { initial: 'details' },
      elements: [
        { ...general, name: 'general', rule: hiddenWhen('hideGeneral') },
        {
          ...details,
          name: 'details',
          rule: hiddenWhen('hideDetails'),
          elements: [
            { type: 'Control', scope: '#/properties/lastName', rule: hiddenWhen('hideChild') },
          ],
        },
      ],
    } as UISchemaElement;
    const conditionalSchema = {
      ...schema,
      properties: {
        ...schema.properties,
        hideGeneral: { type: 'boolean' },
        hideDetails: { type: 'boolean' },
        hideChild: { type: 'boolean' },
      },
    } as JsonSchema;
    const data = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      hideGeneral: false,
      hideDetails: false,
      hideChild: false,
    };
    const { view } = await mountForm({
      renderers,
      schema: conditionalSchema,
      uischema: conditional,
      data,
    });
    const detailsTab = getTabByText(view.container, 'Details');
    expect(detailsTab.getAttribute('aria-selected')).toBe('true');
    expect(getInputByLabel(view.container, 'Last Name').value).toBe('Lovelace');
    await view.rerender({ data: { ...data, hideChild: true } });
    await expect
      .poll(() => view.container.querySelector('input[id="#/properties/lastName-input"]'))
      .toBeNull();
    expect(getTabByText(view.container, 'Details').getAttribute('aria-selected')).toBe('true');
    detailsTab.focus();
    await view.rerender({ data: { ...data, hideChild: true, hideDetails: true } });
    await expect.poll(() => view.container.querySelectorAll('[role="tab"]').length).toBe(1);
    const fallbackTab = getTabByText(view.container, 'General');
    expect(fallbackTab.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(fallbackTab);
    await view.rerender({ data: { ...data, hideGeneral: true, hideDetails: true } });
    await expect.poll(() => view.container.querySelectorAll('[role="tab"]').length).toBe(0);
    expect(view.container.querySelector('[role="tabpanel"]')).toBeNull();
  });

  it('preserves a named selected tab when direct categories reorder', async () => {
    const [general, details] = (uischema as UISchemaElement & { elements: UISchemaElement[] })
      .elements;
    const named = {
      ...uischema,
      options: { initial: 'details' },
      elements: [
        { ...general, name: 'general' },
        { ...details, name: 'details' },
      ],
    } as unknown as UISchemaElement;
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema: named,
      data: { firstName: 'Ada', lastName: 'Lovelace' },
    });
    expect(getTabByText(view.container, 'Details').getAttribute('aria-selected')).toBe('true');
    const changes = onchange.mock.calls.length;
    await view.rerender({
      uischema: {
        ...named,
        elements: [
          ...(named as UISchemaElement & { elements: UISchemaElement[] }).elements,
        ].reverse(),
      },
    });
    await expect
      .poll(() => getTabByText(view.container, 'Details').getAttribute('aria-selected'))
      .toBe('true');
    expect(getInputByLabel(view.container, 'Last Name').value).toBe('Lovelace');
    expect(onchange.mock.calls).toHaveLength(changes);
  });

  it('focuses the first remaining tab when the focused selected category is removed', async () => {
    const [general, details] = (uischema as UISchemaElement & { elements: UISchemaElement[] })
      .elements;
    const named = {
      ...uischema,
      options: { initial: 'details' },
      elements: [
        { ...general, name: 'general' },
        { ...details, name: 'details' },
      ],
    } as unknown as UISchemaElement;
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema: named,
      data: { firstName: 'Ada', lastName: 'Lovelace' },
    });
    getTabByText(view.container, 'Details').focus();
    const changes = onchange.mock.calls.length;
    await view.rerender({
      uischema: {
        ...named,
        elements: [(named as UISchemaElement & { elements: UISchemaElement[] }).elements[0]],
      },
    });
    const fallback = getTabByText(view.container, 'General');
    await expect.poll(() => fallback.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(fallback);
    expect(getInputByLabel(view.container, 'First Name').value).toBe('Ada');
    expect(onchange.mock.calls).toHaveLength(changes);
  });

  it('removes the focused last category without leaving a panel or changing data', async () => {
    const first = (uischema as UISchemaElement & { elements: UISchemaElement[] }).elements[0];
    const single = { ...uischema, elements: [first] } as UISchemaElement;
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema: single,
      data: { firstName: 'Ada' },
    });
    getTabByText(view.container, 'General').focus();
    const changes = onchange.mock.calls.length;
    await view.rerender({ uischema: { ...single, elements: [] } });
    expect(view.container.querySelector('[role="tab"]')).toBeNull();
    expect(view.container.querySelector('[role="tabpanel"]')).toBeNull();
    expect(onchange.mock.calls).toHaveLength(changes);
  });

  it('retains the selected tab draft when named categories reorder', async () => {
    const [general, details] = (uischema as UISchemaElement & { elements: UISchemaElement[] })
      .elements;
    const named = {
      ...uischema,
      options: { initial: 'details' },
      elements: [
        { ...general, name: 'general' },
        { ...details, name: 'details' },
      ],
    } as unknown as UISchemaElement;
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema: named,
      data: { firstName: 'Ada', lastName: 'Lovelace' },
    });
    const input = getInputByLabel(view.container, 'Last Name');
    const changes = onchange.mock.calls.length;
    input.value = 'Byron';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(onchange.mock.calls).toHaveLength(changes);
    await view.rerender({
      uischema: {
        ...named,
        elements: [
          ...(named as UISchemaElement & { elements: UISchemaElement[] }).elements,
        ].reverse(),
      },
    });
    await expect
      .poll(() => getTabByText(view.container, 'Details').getAttribute('aria-selected'))
      .toBe('true');
    const change = await waitForFormChange(onchange, changes);
    expect(change.data.lastName).toBe('Byron');
    expect(getInputByLabel(view.container, 'Last Name').value).toBe('Byron');
  });

  it.each([false, true])(
    'preserves an unnamed or duplicate-named selected tab across reorder (%s)',
    async (duplicate) => {
      const [general, details] = (uischema as UISchemaElement & { elements: UISchemaElement[] })
        .elements;
      const elements = duplicate
        ? [
            { ...general, name: 'shared' },
            { ...details, name: 'shared' },
          ]
        : [general, details];
      const original = { ...uischema, elements } as UISchemaElement;
      const { view, onchange } = await mountForm({
        renderers,
        schema,
        uischema: original,
        data: { firstName: 'Ada', lastName: 'Lovelace' },
      });
      getTabByText(view.container, 'Details').click();
      await expect
        .poll(() => getTabByText(view.container, 'Details').getAttribute('aria-selected'))
        .toBe('true');
      const changes = onchange.mock.calls.length;
      await view.rerender({ uischema: { ...original, elements: [...elements].reverse() } });
      await expect
        .poll(() => getTabByText(view.container, 'Details').getAttribute('aria-selected'))
        .toBe('true');
      expect(getInputByLabel(view.container, 'Last Name').value).toBe('Lovelace');
      expect(onchange.mock.calls).toHaveLength(changes);
    },
  );

  it('retains an unnamed selected category when equivalent UI objects replace it', async () => {
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema,
      data: { firstName: 'Ada', lastName: 'Lovelace' },
    });
    getTabByText(view.container, 'Details').click();
    await expect
      .poll(() => getTabByText(view.container, 'Details').getAttribute('aria-selected'))
      .toBe('true');
    const changes = onchange.mock.calls.length;
    await view.rerender({ uischema: JSON.parse(JSON.stringify(uischema)) });
    await expect
      .poll(() => getTabByText(view.container, 'Details').getAttribute('aria-selected'))
      .toBe('true');
    const reordered = JSON.parse(JSON.stringify(uischema));
    reordered.elements.reverse();
    await view.rerender({ uischema: reordered });
    await expect
      .poll(() => getTabByText(view.container, 'Details').getAttribute('aria-selected'))
      .toBe('true');
    expect(getInputByLabel(view.container, 'Last Name').value).toBe('Lovelace');
    expect(onchange.mock.calls).toHaveLength(changes);
  });

  it('changes tab orientation from the local vertical option without changing the selected data', async () => {
    const withVertical = (vertical: boolean): UISchemaElement =>
      ({ ...uischema, options: { vertical } }) as UISchemaElement;
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema: withVertical(true),
      data: { firstName: 'Ada', lastName: 'Lovelace' },
      config: { vertical: false },
    });
    const tabs = view.container.querySelector('[role="tablist"]');
    expect(tabs?.getAttribute('aria-orientation')).toBe('vertical');
    const changes = onchange.mock.calls.length;
    await view.rerender({ uischema: withVertical(false), config: { vertical: true } });
    expect(tabs?.getAttribute('aria-orientation')).toBe('horizontal');
    await view.rerender({ uischema, config: { vertical: true } });
    expect(tabs?.getAttribute('aria-orientation')).toBe('horizontal');
    expect(onchange.mock.calls).toHaveLength(changes);
  });

  it('visually distinguishes the selected category tab', async () => {
    const { view } = await mountForm({ renderers, schema, uischema });

    const generalTab = getTabByText(view.container, 'General');
    const detailsTab = getTabByText(view.container, 'Details');

    expect(generalTab.dataset.state).toBe('active');
    expect(detailsTab.dataset.state).toBe('inactive');
    expect(getComputedStyle(generalTab).boxShadow).not.toBe('none');
    expect(getComputedStyle(detailsTab).boxShadow).toBe('none');

    detailsTab.click();

    await expect.poll(() => detailsTab.dataset.state).toBe('active');
    expect(getComputedStyle(detailsTab).boxShadow).not.toBe('none');
    await expect.poll(() => getComputedStyle(generalTab).boxShadow).toBe('none');
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

  it('preserves an uncommitted text draft when switching tabs', async () => {
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema,
      data: { firstName: 'Ada', lastName: 'Lovelace' },
    });
    const firstName = getInputByLabel(view.container, 'First Name');
    const initialCalls = onchange.mock.calls.length;
    firstName.value = 'Grace';
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    expect(onchange.mock.calls).toHaveLength(initialCalls);

    getTabByText(view.container, 'Details').click();
    await expect
      .poll(() => getTabByText(view.container, 'Details').getAttribute('aria-selected'))
      .toBe('true');
    const change = await waitForFormChange(onchange, initialCalls);
    expect(change.data.firstName).toBe('Grace');
    getTabByText(view.container, 'General').click();
    await expect.poll(() => getInputByLabel(view.container, 'First Name').value).toBe('Grace');
  });
  it('does not leave a tab while its text control is composing', async () => {
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema,
      data: { firstName: 'Ada', lastName: 'Lovelace' },
    });
    const input = getInputByLabel(view.container, 'First Name');
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = 'Grace';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const details = getTabByText(view.container, 'Details');
    details.click();
    expect(getTabByText(view.container, 'General').getAttribute('aria-selected')).toBe('true');
    expect(onchange.mock.lastCall?.[0].data.firstName).toBe('Ada');
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    details.click();
    await expect.poll(() => details.getAttribute('aria-selected')).toBe('true');
    await expect.poll(() => onchange.mock.lastCall?.[0].data.firstName).toBe('Grace');
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
  getTabByText(view.container, 'Long category 0').focus();
  await userEvent.keyboard('{End}');
  const lastTab = getTabByText(view.container, 'Long category 11');
  await expect.poll(() => lastTab.getAttribute('aria-selected')).toBe('true');
  const input = view.container.querySelector<HTMLInputElement>('input');
  expect(input).not.toBeNull();
  const bounds = view.container.getBoundingClientRect();
  const inputBounds = input!.getBoundingClientRect();
  expect(inputBounds.left).toBeGreaterThanOrEqual(bounds.left);
  expect(inputBounds.right).toBeLessThanOrEqual(bounds.right + 1);
  const tabBounds = lastTab.getBoundingClientRect();
  expect(tabBounds.left).toBeGreaterThanOrEqual(bounds.left);
  expect(tabBounds.right).toBeLessThanOrEqual(bounds.right + 1);
  expect(view.container.scrollLeft).toBe(0);
});
