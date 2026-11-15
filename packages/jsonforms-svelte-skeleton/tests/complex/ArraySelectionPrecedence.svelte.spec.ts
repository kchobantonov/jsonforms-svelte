import { type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as choices } from '../../src/lib/complex/ArrayChoicesRenderer.entry';
import { entry as table } from '../../src/lib/complex/ArrayControlRenderer.entry';
import { entry as finite } from '../../src/lib/complex/EnumArrayRenderer.entry';
import { entry as layout } from '../../src/lib/layouts/ArrayLayoutRenderer.entry';
import { entry as string } from '../../src/lib/controls/StringControlRenderer.entry';
import { mountForm } from '../testUtils';

afterEach(cleanup);

const renderers = [choices, table, finite, layout, string];
const control = (options?: Record<string, unknown>): UISchemaElement => ({
  type: 'Control',
  scope: '#/properties/items',
  options,
});
const formSchema = (items: JsonSchema, uniqueItems = false): JsonSchema =>
  ({
    type: 'object',
    properties: { items: { type: 'array', items, uniqueItems } },
  }) as JsonSchema;

it.each([
  {
    name: 'primitive default table',
    items: { type: 'string' },
    value: ['Ada'],
    options: {},
    presentation: 'table',
  },
  {
    name: 'primitive table false',
    items: { type: 'string' },
    value: ['Ada'],
    options: { table: false },
    presentation: 'layout',
  },
  {
    name: 'nested object default layout',
    items: {
      type: 'object',
      properties: { nested: { type: 'object', properties: { name: { type: 'string' } } } },
    },
    value: [{ nested: { name: 'Ada' } }],
    options: {},
    presentation: 'layout',
  },
  {
    name: 'nested object explicit table',
    items: {
      type: 'object',
      properties: { nested: { type: 'object', properties: { name: { type: 'string' } } } },
    },
    value: [{ nested: { name: 'Ada' } }],
    options: { table: true },
    presentation: 'table',
  },
  {
    name: 'nested object table format',
    items: {
      type: 'object',
      properties: { nested: { type: 'object', properties: { name: { type: 'string' } } } },
    },
    value: [{ nested: { name: 'Ada' } }],
    options: { format: 'table' },
    presentation: 'table',
  },
  {
    name: 'nested array default layout',
    items: { type: 'object', properties: { labels: { type: 'array', items: { type: 'string' } } } },
    value: [{ labels: ['Ada'] }],
    options: {},
    presentation: 'layout',
  },
  {
    name: 'nested array explicit table',
    items: { type: 'object', properties: { labels: { type: 'array', items: { type: 'string' } } } },
    value: [{ labels: ['Ada'] }],
    options: { table: true },
    presentation: 'table',
  },
])('selects $name', async ({ items, value, options, presentation }) => {
  const { view } = await mountForm({
    renderers,
    schema: formSchema(items as JsonSchema),
    uischema: control(options),
    data: { items: value },
  });
  expect(view.container.querySelector('table') !== null).toBe(presentation === 'table');
});

it('keeps the automatic finite-array checkbox renderer above the default table', async () => {
  const { view } = await mountForm({
    renderers,
    schema: formSchema({ type: 'string', enum: ['A', 'B'] }, true),
    uischema: control(),
    data: { items: ['A'] },
  });
  expect(view.container.querySelector('table')).toBeNull();
  expect(view.container.querySelectorAll('[role="checkbox"], input[type="checkbox"]')).toHaveLength(
    2,
  );
});

it('lets an explicit table request override the automatic finite-array checkbox renderer', async () => {
  const { view } = await mountForm({
    renderers,
    schema: formSchema({ type: 'string', enum: ['A', 'B'] }, true),
    uischema: control({ table: true }),
    data: { items: ['A'] },
  });
  expect(view.container.querySelector('table')).not.toBeNull();
});

it.each(['multi-select', 'chips'])(
  'keeps the explicit %s variant above finite-array checkboxes',
  async (variant) => {
    const { view } = await mountForm({
      renderers,
      schema: formSchema({ type: 'string', enum: ['A', 'B'] }, true),
      uischema: control({ variant }),
      data: { items: ['A'] },
    });
    expect(view.container.querySelector('table')).toBeNull();
    expect(view.container.querySelector('button[aria-label="Remove A"]')).not.toBeNull();
    expect(
      view.container.querySelectorAll('[role="checkbox"], input[type="checkbox"]'),
    ).toHaveLength(0);
  },
);
