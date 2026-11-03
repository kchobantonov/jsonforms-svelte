import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { flowbiteRenderers } from '../../src/lib';
import { mountForm } from '../testUtils';

beforeEach(() => clearAllIds());
afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

it('does not reveal or focus a control in an inactive category', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const schema: JsonSchema = {
    type: 'object',
    properties: { first: { type: 'string' }, second: { type: 'string' } },
  };
  const uischema: UISchemaElement = {
    type: 'Categorization',
    elements: [
      {
        type: 'Category',
        label: 'First',
        elements: [{ type: 'Control', scope: '#/properties/first', options: { focus: true } }],
      },
      {
        type: 'Category',
        label: 'Second',
        elements: [{ type: 'Control', scope: '#/properties/second', options: { focus: true } }],
      },
    ],
  };
  const { view } = await mountForm({
    renderers: flowbiteRenderers,
    schema,
    uischema,
    data: { first: 'One', second: 'Two' },
    config: { focus: false },
  });
  const firstTab = Array.from(view.container.querySelectorAll<HTMLElement>('[role="tab"]')).find(
    (tab) => tab.textContent?.includes('First'),
  );
  expect(firstTab?.getAttribute('aria-selected')).toBe('true');
  const secondInput = view.container.querySelector<HTMLElement>('[id="#/properties/second-input"]');
  expect(secondInput?.checkVisibility() ?? false).toBe(false);
  expect(document.activeElement).not.toBe(secondInput);
  expect(firstTab?.getAttribute('aria-selected')).toBe('true');
  const secondTab = Array.from(view.container.querySelectorAll<HTMLElement>('[role="tab"]')).find(
    (tab) => tab.textContent?.includes('Second'),
  )!;
  secondTab.click();
  await expect.poll(() => secondTab.getAttribute('aria-selected')).toBe('true');
  const revealedInput = view.container.querySelector<HTMLElement>(
    '[id="#/properties/second-input"]',
  );
  expect(revealedInput?.checkVisibility()).toBe(true);
  if (!secondInput) await expect.poll(() => document.activeElement).toBe(revealedInput);
  expect(warn.mock.calls.filter(([code]) => code === 'focus.conflict')).toEqual([]);
});

it('keeps multiple active focus requests native without writing form data', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const ondiagnostic = vi.fn();
  const schema: JsonSchema = {
    type: 'object',
    properties: { first: { type: 'string' }, second: { type: 'string' } },
  };
  const uischema: UISchemaElement = {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/first', options: { focus: true } },
      { type: 'Control', scope: '#/properties/second', options: { focus: true } },
    ],
  };
  const { view, onchange } = await mountForm({
    renderers: flowbiteRenderers,
    schema,
    uischema,
    data: { first: 'One', second: 'Two' },
    ondiagnostic,
  });
  const inputs = [...view.container.querySelectorAll<HTMLInputElement>('input')];
  expect(inputs).toHaveLength(2);
  expect(inputs.filter((input) => input.hasAttribute('autofocus'))).toHaveLength(2);
  expect(inputs).toContain(document.activeElement);
  expect(onchange.mock.lastCall?.[0].data).toEqual({ first: 'One', second: 'Two' });
  await vi.waitFor(() =>
    expect(warn.mock.calls.filter(([code]) => code === 'focus.conflict')).toEqual([
      [
        'focus.conflict',
        {
          severity: 'warning',
          message: 'Several active controls request initial focus; the winner is not portable.',
          details: { paths: ['first', 'second'] },
        },
      ],
    ]),
  );
  expect(ondiagnostic).toHaveBeenCalledExactlyOnceWith({
    code: 'focus.conflict',
    severity: 'warning',
    message: 'Several active controls request initial focus; the winner is not portable.',
    details: { paths: ['first', 'second'] },
  });
});

it('ignores a focus request in a collapsed group until it opens', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const ondiagnostic = vi.fn();
  const schema: JsonSchema = {
    type: 'object',
    properties: { first: { type: 'string' }, second: { type: 'string' } },
  };
  const uischema: UISchemaElement = {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/first', options: { focus: true } },
      {
        type: 'Group',
        label: 'Hidden details',
        options: { collapsible: true, collapsed: true },
        elements: [{ type: 'Control', scope: '#/properties/second', options: { focus: true } }],
      },
    ],
  };
  const { view, onchange } = await mountForm({
    renderers: flowbiteRenderers,
    schema,
    uischema,
    data: { first: 'One', second: 'Two' },
    ondiagnostic,
  });
  await Promise.resolve();
  expect(warn.mock.calls.filter(([code]) => code === 'focus.conflict')).toEqual([]);
  view.container.querySelector<HTMLButtonElement>('button[aria-label="Hidden details"]')!.click();
  await vi.waitFor(() =>
    expect(warn.mock.calls.filter(([code]) => code === 'focus.conflict')).toEqual([
      [
        'focus.conflict',
        {
          severity: 'warning',
          message: 'Several active controls request initial focus; the winner is not portable.',
          details: { paths: ['first', 'second'] },
        },
      ],
    ]),
  );
  expect(
    ondiagnostic.mock.calls.filter(([diagnostic]) => diagnostic.code === 'focus.conflict'),
  ).toHaveLength(1);
  const toggle = view.container.querySelector<HTMLButtonElement>(
    'button[aria-label="Hidden details"]',
  )!;
  toggle.click();
  await vi.waitFor(() => expect(toggle.getAttribute('aria-expanded')).toBe('false'));
  toggle.click();
  await vi.waitFor(() =>
    expect(
      ondiagnostic.mock.calls.filter(([diagnostic]) => diagnostic.code === 'focus.conflict'),
    ).toHaveLength(2),
  );
  expect(onchange.mock.lastCall?.[0].data).toEqual({ first: 'One', second: 'Two' });
});

it.each(['stepper', 'accordion'] as const)(
  'counts only the active %s category for focus conflicts',
  async (variant) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const schema: JsonSchema = {
      type: 'object',
      properties: { first: { type: 'string' }, second: { type: 'string' } },
    };
    const uischema: UISchemaElement = {
      type: 'Categorization',
      options: { variant },
      elements: [
        {
          type: 'Category',
          label: 'First',
          elements: [{ type: 'Control', scope: '#/properties/first', options: { focus: true } }],
        },
        {
          type: 'Category',
          label: 'Second',
          elements: [{ type: 'Control', scope: '#/properties/second', options: { focus: true } }],
        },
      ],
    };
    const { view } = await mountForm({
      renderers: flowbiteRenderers,
      schema,
      uischema,
      data: { first: 'One', second: 'Two' },
    });
    await Promise.resolve();
    expect(
      view.container.querySelector<HTMLInputElement>('[id="#/properties/first-input"]'),
    ).not.toBeNull();
    expect(warn.mock.calls.filter(([code]) => code === 'focus.conflict')).toEqual([]);
  },
);
