import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { cleanup } from 'vitest-browser-svelte';
import { entry as labelRendererEntry } from '../../src/lib/additional/LabelRenderer.entry';
import { mountForm } from '../testUtils';

describe('LabelRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [labelRendererEntry];

  it('renders label text when visible', () => {
    const schema = {
      type: 'object',
      properties: {
        showLabel: { type: 'boolean' },
      },
    } as JsonSchema;
    const uischema = {
      type: 'Label',
      text: 'Important Notice',
    } as UISchemaElement;

    const { view } = mountForm({
      renderers,
      schema,
      uischema,
      data: { showLabel: true },
    });

    const label = view.container.querySelector('label');
    expect(label).toBeTruthy();
    expect((label?.textContent ?? '').trim()).toBe('Important Notice');
  });

  it('hides label when show rule is not satisfied', () => {
    const schema = {
      type: 'object',
      properties: {
        showLabel: { type: 'boolean' },
      },
    } as JsonSchema;
    const uischema = {
      type: 'Label',
      text: 'Hidden Notice',
      rule: {
        effect: 'SHOW',
        condition: {
          scope: '#/properties/showLabel',
          schema: { const: true },
        },
      },
    } as UISchemaElement;

    const { view } = mountForm({
      renderers,
      schema,
      uischema,
      data: { showLabel: false },
    });

    const text = (view.container.textContent ?? '').trim();
    expect(text.includes('Hidden Notice')).toBe(false);
    expect(view.container.querySelector('label')).toBeNull();
  });
});
