import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as groupRendererEntry } from '../../src/lib/layouts/GroupRenderer.entry';
import { expectLabelVisible, getBySelector, mountForm, waitForFormChange } from '../testUtils';

describe('GroupRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
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

  it('renders the group label and child control when no data is provided', () => {
    const { view } = mountForm({ renderers, schema, uischema });

    expect((view.container.textContent ?? '').includes('Profile')).toBe(true);
    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="text"]');
    expect(input.value).toBe('');
    expectLabelVisible(view.container, 'Email');
  });

  it('updates core data when group child control changes', async () => {
    const { view, onchange } = mountForm({
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
});
