import '../test.css';
import { clearAllIds, RuleEffect, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as booleanControlRendererEntry } from '../../src/lib/controls/BooleanControlRenderer.entry';
import { entry as integerControlRendererEntry } from '../../src/lib/controls/IntegerControlRenderer.entry';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as groupRendererEntry } from '../../src/lib/layouts/GroupRenderer.entry';
import { expectLabelVisible, getBySelector, mountForm, waitForFormChange } from '../testUtils';

describe('GroupRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [groupRendererEntry, stringControlRendererEntry];

  const schema = {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        title: 'Email',
        format: 'email',
      },
    },
  } as JsonSchema;

  const uischema: UISchemaElement = {
    type: 'Group',
    label: 'Profile',
    elements: [{ type: 'Control', scope: '#/properties/email' }],
  };

  it('diagnoses active flat disclosure and data-indicator defaults once', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const { view } = await mountForm({
        renderers,
        schema,
        uischema,
        data: { email: 'ada@example.com' },
        config: { collapsible: true, showDataIndicator: true },
      });
      await expect.poll(() => view.container.querySelector('button[aria-expanded]')).not.toBeNull();
      expect(view.container.querySelector('[data-group-indicator]')).not.toBeNull();
      const diagnostics = () =>
        warning.mock.calls
          .map(([message]) => String(message))
          .filter((message) => message.includes('section.legacyFlatOption'));
      await expect.poll(diagnostics).toHaveLength(2);
      await view.rerender({ data: { email: 'new@example.com' } });
      expect(diagnostics()).toHaveLength(2);
    } finally {
      warning.mockRestore();
    }
  });

  it('renders the group label and child control when no data is provided', async () => {
    const { view } = await mountForm({ renderers, schema, uischema });

    expect((view.container.textContent ?? '').includes('Profile')).toBe(true);
    const frame = getBySelector<HTMLElement>(view.container, '[data-group-frame]');
    expect(frame.getAttribute('role')).toBe('group');
    expect(frame.getAttribute('aria-label')).toBe('Profile');
    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="text"]');
    expect(input.value).toBe('');
    expectLabelVisible(view.container, 'Email');
  });

  it('keeps an untitled group without an empty accessible name', async () => {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema: { ...uischema, label: '' },
    });
    const frame = getBySelector<HTMLElement>(view.container, '[data-group-frame]');
    expect(frame.getAttribute('role')).toBe('group');
    expect(frame.hasAttribute('aria-label')).toBe(false);
    expect(frame.querySelector('input[type="text"]')).not.toBeNull();
  });

  it('retains the Group heading and frame when its only child is hidden', async () => {
    const conditionalSchema = {
      ...schema,
      properties: { ...schema.properties, hide: { type: 'boolean' } },
    } as JsonSchema;
    const conditional = {
      ...uischema,
      elements: [
        {
          type: 'Control',
          scope: '#/properties/email',
          rule: {
            effect: RuleEffect.HIDE,
            condition: { scope: '#/properties/hide', schema: { const: true } },
          },
        },
      ],
    } as UISchemaElement;
    const { view } = await mountForm({
      renderers,
      schema: conditionalSchema,
      uischema: conditional,
      data: { email: 'ada@example.com', hide: false },
    });
    expect(getBySelector<HTMLInputElement>(view.container, 'input[type="text"]').value).toBe(
      'ada@example.com',
    );
    await view.rerender({ data: { email: 'ada@example.com', hide: true } });
    await expect.poll(() => view.container.querySelector('input[type="text"]')).toBeNull();
    const frame = getBySelector<HTMLElement>(view.container, '[data-group-frame]');
    expect(frame.getAttribute('aria-label')).toBe('Profile');
    expect(frame.textContent).toContain('Profile');
  });

  it('updates core data when group child control changes', async () => {
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema,
      data: { email: 'ada@example.com' },
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="text"]');
    expect(input.value).toBe('ada@example.com');

    const before = onchange.mock.calls.length;
    input.value = 'byron@example.com';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForFormChange(onchange, before);

    expect(changeEvent.data.email).toBe('byron@example.com');
  });
  it('keeps its data indicator visible when collapsed and expanded', async () => {
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema: {
        ...uischema,
        options: { collapsible: true, collapsed: true, showDataIndicator: true },
      },
      data: { email: 'ada@example.com' },
    });
    const toggle = getBySelector<HTMLButtonElement>(view.container, 'button[aria-expanded]');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(view.container.querySelector('[data-group-indicator]')).not.toBeNull();
    const content = view.container.querySelector<HTMLElement>(
      `[id="${toggle.getAttribute('aria-controls')}"]`,
    )!;
    expect(content.hidden).toBe(true);
    toggle.click();
    await expect.poll(() => toggle.getAttribute('aria-expanded')).toBe('true');
    expect(content.hidden).toBe(false);
    expect(view.container.querySelector('[data-group-indicator]')).not.toBeNull();
    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="text"]');
    const before = onchange.mock.calls.length;
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForFormChange(onchange, before);
    await expect.poll(() => view.container.querySelector('[data-group-indicator]')).toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('counts false and zero in hidden descendants and localizes the data marker live', async () => {
    const conditional = {
      type: 'Group',
      label: 'Status',
      options: { showDataIndicator: true },
      elements: [
        {
          type: 'Control',
          scope: '#/properties/flag',
          rule: {
            effect: RuleEffect.HIDE,
            condition: { scope: '#/properties/hide', schema: { const: true } },
          },
        },
        { type: 'Control', scope: '#/properties/count' },
      ],
    } as UISchemaElement;
    const { view } = await mountForm({
      renderers: [groupRendererEntry, booleanControlRendererEntry, integerControlRendererEntry],
      schema: {
        type: 'object',
        properties: {
          flag: { type: 'boolean' },
          count: { type: 'integer' },
          hide: { type: 'boolean' },
          unrelated: { type: 'string' },
        },
      } as JsonSchema,
      uischema: conditional,
      data: { flag: false, count: null, hide: true, unrelated: 'present' },
      i18n: { locale: 'en' },
    });
    const marker = () => view.container.querySelector<HTMLElement>('[data-group-indicator]');
    await expect.poll(marker).not.toBeNull();
    expect(view.container.querySelector('input[type="checkbox"]')).toBeNull();
    await view.rerender({ i18n: { locale: 'bg' } });
    await expect.poll(() => marker()?.getAttribute('aria-label')).toBe('Секцията съдържа данни');
    expect(marker()?.title).toBe('Секцията съдържа данни');
    await view.rerender({ data: { flag: null, count: 0, hide: true, unrelated: 'present' } });
    await expect.poll(marker).not.toBeNull();
    await view.rerender({ data: { flag: null, count: null, hide: true, unrelated: 'present' } });
    await expect.poll(marker).toBeNull();
  });

  it('does not show an indicator or collapse action unless opted in', async () => {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema,
      data: { email: 'ada@example.com' },
    });
    expect(view.container.querySelector('[data-group-indicator]')).toBeNull();
    expect(view.container.querySelector('button[aria-expanded]')).toBeNull();
  });
  it('keeps a child Control data-indicator option scoped to the Control', async () => {
    const withChildOption = {
      ...uischema,
      elements: [
        { type: 'Control', scope: '#/properties/email', options: { showDataIndicator: true } },
      ],
    };
    const { view } = await mountForm({
      renderers,
      schema,
      uischema: withChildOption,
      data: { email: 'ada@example.com' },
    });
    expect(view.container.querySelector('[data-group-indicator]')).toBeNull();
    await view.rerender({ uischema: { ...withChildOption, options: { showDataIndicator: true } } });
    await expect.poll(() => view.container.querySelector('[data-group-indicator]')).not.toBeNull();
  });
  it('removes the group boundary when local showBorder is false', async () => {
    const { view } = await mountForm({ renderers, schema, uischema });
    const frame = getBySelector<HTMLElement>(view.container, '[data-group-frame]');
    expect(frame.classList.contains('border-0')).toBe(false);
    await view.rerender({
      uischema: { ...uischema, options: { showBorder: false } },
    });
    await expect.poll(() => frame.classList.contains('border-0')).toBe(true);
    expect(view.container.querySelector('input[type="text"]')).not.toBeNull();
    await view.rerender({
      uischema: { ...uischema, options: { showBorder: true } },
    });
    await expect.poll(() => frame.classList.contains('border-0')).toBe(false);
  });
  it('preserves a local toggle across equivalent options and follows changed collapse options', async () => {
    const group = (collapsed: boolean): UISchemaElement => ({
      ...uischema,
      options: { collapsible: true, collapsed },
    });
    const { view } = await mountForm({ renderers, schema, uischema: group(true) });
    const toggle = getBySelector<HTMLButtonElement>(view.container, 'button[aria-expanded]');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    await expect.poll(() => toggle.getAttribute('aria-expanded')).toBe('true');
    await view.rerender({ uischema: group(true) });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    await view.rerender({ uischema: group(false) });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    await view.rerender({ uischema: group(true) });
    await expect.poll(() => toggle.getAttribute('aria-expanded')).toBe('false');
  });
  it('uses namespaced collapse defaults and local false overrides', async () => {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema: { ...uischema, options: { collapsible: true } },
      config: { collapsed: true, jsonformsExtended: { group: { collapsed: false } } },
    });
    const toggle = getBySelector<HTMLButtonElement>(view.container, 'button[aria-expanded]');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    await view.rerender({ config: { jsonformsExtended: { group: { collapsed: true } } } });
    await expect.poll(() => toggle.getAttribute('aria-expanded')).toBe('false');
    await view.rerender({
      uischema: { ...uischema, options: { collapsible: true, collapsed: false } },
    });
    await expect.poll(() => toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('diagnoses a non-boolean collapsed option without treating it as true', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      const { view } = await mountForm({
        renderers,
        schema,
        uischema: { ...uischema, options: { collapsible: true, collapsed: null } },
        config: { jsonformsExtended: { collapsed: true } },
      });
      const toggle = getBySelector<HTMLButtonElement>(view.container, 'button[aria-expanded]');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      const diagnostics = () =>
        warning.mock.calls.filter(([code]) => code === 'section.invalidCollapsed');
      await vi.waitFor(() => expect(diagnostics()).toHaveLength(1));
      expect(diagnostics()[0]).toEqual([
        'section.invalidCollapsed',
        { component: 'group', source: 'options.collapsed', type: 'null' },
      ]);
      await view.rerender({ data: { email: 'new@example.com' } });
      expect(diagnostics()).toHaveLength(1);
      await view.rerender({
        uischema: { ...uischema, options: { collapsible: true, collapsed: false } },
      });
      await expect.poll(() => toggle.getAttribute('aria-expanded')).toBe('true');
      await view.rerender({ config: { jsonformsExtended: { collapsed: 'invalid' } } });
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(diagnostics()).toHaveLength(1);
    } finally {
      warning.mockRestore();
    }
  });
  it('localizes data indicators and applies namespaced display defaults', async () => {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema,
      data: { email: 'ada@example.com' },
      config: { jsonformsExtended: { showDataIndicator: true } },
      i18n: { locale: 'bg' },
    });
    const indicator = getBySelector<HTMLElement>(view.container, '[data-group-indicator]');
    expect(indicator.getAttribute('aria-label')).toBe('Секцията съдържа данни');
    expect(indicator.title).toBe('Секцията съдържа данни');
  });
  it('retains native Card spacing between the disclosure header and content', async () => {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema: { ...uischema, options: { collapsible: true } },
    });
    const header = getBySelector<HTMLElement>(view.container, '[data-slot="card-header"]');
    const body = getBySelector<HTMLElement>(view.container, '[data-layout="column"]');
    expect(
      body.getBoundingClientRect().top - header.getBoundingClientRect().bottom,
    ).toBeGreaterThanOrEqual(16);
  });
});
