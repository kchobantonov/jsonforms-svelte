import { userEvent } from 'vite-plus/test/browser';
import {
  clearAllIds,
  RuleEffect,
  type JsonSchema,
  type UISchemaElement,
  type Translator,
} from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as objectRendererEntry } from '../../src/lib/complex/ObjectRenderer.entry';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as categorizationStepperEntry } from '../../src/lib/layouts/CategorizationStepperRenderer.entry';
import { entry as layoutRendererEntry } from '../../src/lib/layouts/LayoutRenderer.entry';
import { getButtonByText, getInputByLabel, mountForm, waitForFormChange } from '../testUtils';

describe('CategorizationStepperRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
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

  it('renders first step and navigation buttons when no data is provided', async () => {
    const { view } = await mountForm({ renderers, schema, uischema });
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

  it('supports keyboard step headers and Previous/Next without moving focus into hidden panels', async () => {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema,
      data: { firstName: 'Ada', lastName: 'Lovelace' },
    });
    const details = getButtonByText(view.container, 'Details');
    details.focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() =>
      expect(getInputByLabel(view.container, 'Last Name').value).toBe('Lovelace'),
    );
    expect(document.activeElement).toBe(details);
    const previous = getButtonByText(view.container, 'Previous');
    previous.focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(getInputByLabel(view.container, 'First Name').value).toBe('Ada'));
    expect(document.activeElement?.closest('[hidden], [inert]')).toBeNull();
    const next = getButtonByText(view.container, 'Next');
    next.focus();
    await userEvent.keyboard(' ');
    await vi.waitFor(() =>
      expect(getInputByLabel(view.container, 'Last Name').value).toBe('Lovelace'),
    );
    expect(document.activeElement?.closest('[hidden], [inert]')).toBeNull();
  });

  it('resolves stepper navigation buttons from local then flat config, defaulting off', async () => {
    const withoutNav = { ...uischema, options: { variant: 'stepper' } } as UISchemaElement;
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema: withoutNav,
      data: { firstName: 'Ada', lastName: 'Lovelace' },
    });
    const navButtons = () =>
      [...view.container.querySelectorAll('button')].filter((button) =>
        ['Previous', 'Next'].includes(button.textContent?.trim() ?? ''),
      );
    expect(navButtons()).toHaveLength(0);
    const initialCalls = onchange.mock.calls.length;
    await view.rerender({ config: { showNavButtons: true } });
    await vi.waitFor(() => expect(navButtons()).toHaveLength(2));
    await view.rerender({
      uischema: { ...withoutNav, options: { variant: 'stepper', showNavButtons: false } },
    });
    await vi.waitFor(() => expect(navButtons()).toHaveLength(0));
    await view.rerender({ config: { showNavButtons: false }, uischema });
    await vi.waitFor(() => expect(navButtons()).toHaveLength(2));
    expect(onchange.mock.calls).toHaveLength(initialCalls);
  });

  it('does not enable stepper navigation from a child Control option', async () => {
    const childOption = {
      type: 'Categorization',
      options: { variant: 'stepper' },
      elements: [
        {
          type: 'Category',
          label: 'General',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/firstName',
              options: { showNavButtons: true },
            },
          ],
        },
        {
          type: 'Category',
          label: 'Details',
          elements: [{ type: 'Control', scope: '#/properties/lastName' }],
        },
      ],
    } as UISchemaElement;
    const { view } = await mountForm({ renderers, schema, uischema: childOption });
    const navButtons = () =>
      [...view.container.querySelectorAll('button')].filter((button) =>
        ['Previous', 'Next'].includes(button.textContent?.trim() ?? ''),
      );
    expect(navButtons()).toHaveLength(0);
    await view.rerender({
      uischema: { ...childOption, options: { variant: 'stepper', showNavButtons: true } },
    });
    await vi.waitFor(() => expect(navButtons()).toHaveLength(2));
  });

  it('moves to next step and updates core data', async () => {
    const { view, onchange } = await mountForm({
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
  it('preserves an uncommitted text draft when navigating away and back', async () => {
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

    getButtonByText(view.container, 'Next').click();
    await vi.waitFor(() =>
      expect(getInputByLabel(view.container, 'Last Name').value).toBe('Lovelace'),
    );
    const change = await waitForFormChange(onchange, initialCalls);
    expect(change.data.firstName).toBe('Grace');
    getButtonByText(view.container, 'Previous').click();
    await vi.waitFor(() =>
      expect(getInputByLabel(view.container, 'First Name').value).toBe('Grace'),
    );
  });

  it.each(['named', 'unnamed', 'duplicate'])(
    'keeps the selected step and pending draft across category reorder (%s)',
    async (mode) => {
      const [general, details] = (uischema as UISchemaElement & { elements: UISchemaElement[] })
        .elements;
      const firstCategory =
        mode === 'named'
          ? { ...general, name: 'general' }
          : mode === 'duplicate'
            ? { ...general, name: 'shared' }
            : general;
      const secondCategory =
        mode === 'named'
          ? { ...details, name: 'details' }
          : mode === 'duplicate'
            ? { ...details, name: 'shared' }
            : details;
      const authored = {
        ...uischema,
        elements: [firstCategory, secondCategory],
      } as UISchemaElement;
      const { view, onchange } = await mountForm({
        renderers,
        schema,
        uischema: authored,
        data: { firstName: 'Ada', lastName: 'Lovelace' },
      });
      const initialCalls = onchange.mock.calls.length;
      const firstName = getInputByLabel(view.container, 'First Name');
      firstName.value = 'Grace';
      firstName.dispatchEvent(new Event('input', { bubbles: true }));
      expect(onchange.mock.calls).toHaveLength(initialCalls);

      await view.rerender({
        uischema: { ...authored, elements: [secondCategory, firstCategory] } as UISchemaElement,
      });
      expect(getButtonByText(view.container, 'Next').disabled).toBe(true);
      expect(getInputByLabel(view.container, 'First Name').value).toBe('Grace');
      const change = await waitForFormChange(onchange, initialCalls);
      expect(change.data.firstName).toBe('Grace');
    },
  );

  it.each([false, true])(
    'falls back when the active step is hidden without changing data (vertical=%s)',
    async (vertical) => {
      const [general, details] = (uischema as UISchemaElement & { elements: UISchemaElement[] })
        .elements;
      const rule = {
        effect: RuleEffect.HIDE,
        condition: { scope: '#/properties/hide', schema: { const: true } },
      };
      const conditional = {
        type: 'Categorization',
        options: { variant: 'stepper', showNavButtons: true, initial: 'details', vertical },
        elements: [
          { ...general, name: 'general' },
          { ...details, name: 'details', rule },
        ],
      } as UISchemaElement;
      const conditionalSchema = {
        ...schema,
        properties: { ...schema.properties, hide: { type: 'boolean' } },
      } as JsonSchema;
      const { view, onchange } = await mountForm({
        renderers,
        schema: conditionalSchema,
        uischema: conditional,
        data: { firstName: 'Ada', lastName: 'Lovelace', hide: false },
      });
      expect(getInputByLabel(view.container, 'Last Name').value).toBe('Lovelace');
      const initialCalls = onchange.mock.calls.length;
      getButtonByText(view.container, 'Details').focus();
      await view.rerender({ data: { firstName: 'Ada', lastName: 'Lovelace', hide: true } });
      await vi.waitFor(() =>
        expect(getInputByLabel(view.container, 'First Name').value).toBe('Ada'),
      );
      expect(view.container.textContent).not.toContain('Details');
      expect(getButtonByText(view.container, 'Next').disabled).toBe(true);
      expect(document.activeElement).toBe(getButtonByText(view.container, 'General'));
      expect(onchange.mock.calls).toHaveLength(initialCalls + 1);
      expect(onchange.mock.lastCall?.[0].data).toEqual({
        firstName: 'Ada',
        lastName: 'Lovelace',
        hide: true,
      });
    },
  );

  it('translates navigation with catalogs and live host overrides', async () => {
    const { view } = await mountForm({ renderers, schema, uischema, i18n: { locale: 'bg' } });
    expect(getButtonByText(view.container, 'Назад').disabled).toBe(true);
    expect(getButtonByText(view.container, 'Напред').disabled).toBe(false);
    await view.rerender({
      i18n: {
        locale: 'fr',
        translate: ((key: string, fallback?: string) =>
          key === 'categorization.previous'
            ? 'Retour'
            : key === 'categorization.next'
              ? 'Suite'
              : fallback) as Translator,
      },
    });
    expect(getButtonByText(view.container, 'Retour').disabled).toBe(true);
    expect(getButtonByText(view.container, 'Suite').disabled).toBe(false);
  });
  it.each(['en', 'bg'])('routes nested bracket-key step feedback in %s', async (locale) => {
    const detail = {
      type: 'Categorization',
      options: { variant: 'stepper' },
      elements: [
        {
          type: 'Category',
          label: 'Details',
          options: { showValidationIndicator: true, showValidationIndicatorCount: true },
          elements: [{ type: 'Control', scope: '#/properties/name' }],
        },
      ],
    };
    const { view } = await mountForm({
      renderers: [...renderers, objectRendererEntry],
      schema: {
        type: 'object',
        properties: {
          'record[0]': { type: 'object', properties: { name: { type: 'string', minLength: 2 } } },
        },
      },
      uischema: { type: 'Control', scope: '#/properties/record[0]', options: { detail } },
      data: { 'record[0]': { name: 'X' } },
      i18n: {
        locale,
        translate: ((key: string, fallback?: string) =>
          key === 'validation.containerError' ? 'ROW_ERROR' : fallback) as Translator,
      },
    });
    await expect.poll(() => view.container.textContent).toContain('ROW_ERROR');
    await view.rerender({ data: { 'record[0]': { name: 'Valid' } } });
    await expect.poll(() => view.container.textContent).not.toContain('ROW_ERROR');
  });

  it.each(['en', 'bg'])(
    'keeps vertical step validation and data feedback visible and named in %s',
    async (locale) => {
      const vertical = {
        ...uischema,
        options: { variant: 'stepper', vertical: true },
        elements: [
          {
            type: 'Category',
            label: 'General',
            options: {
              showValidationIndicator: true,
              showValidationIndicatorCount: true,
              showDataIndicator: true,
            },
            elements: [{ type: 'Control', scope: '#/properties/firstName' }],
          },
        ],
      } as UISchemaElement;
      const { view } = await mountForm({
        renderers,
        schema: {
          ...schema,
          properties: { firstName: { type: 'string', minLength: 2 } },
        },
        uischema: vertical,
        data: { firstName: 'X' },
        i18n: {
          locale,
          translate: ((key: string, fallback?: string) =>
            key === 'validation.containerError'
              ? 'ROW_ERROR'
              : key === 'group.dataIndicator'
                ? 'HAS_DATA'
                : fallback) as Translator,
        },
      });
      const header = getButtonByText(view.container, 'General');
      await expect.poll(() => header.textContent).toContain('ROW_ERROR');
      expect(header.textContent).toContain('HAS_DATA');
      expect(header.getAttribute('aria-current')).toBe('step');
      await view.rerender({ data: { firstName: 'Valid' } });
      await expect.poll(() => header.textContent).not.toContain('ROW_ERROR');
      expect(header.textContent).toContain('HAS_DATA');
    },
  );
});
