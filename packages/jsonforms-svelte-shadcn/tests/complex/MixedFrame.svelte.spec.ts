import '../test.css';
import { afterEach, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { cleanup } from 'vitest-browser-svelte';
import { type ControlElement } from '@jsonforms/core';
import { shadcnRenderers } from '../../src/lib/renderers';
import { mountForm } from '../testUtils';
afterEach(cleanup);

it.each(['nested', 'tree'])(
  'honors reactive collapse precedence in the %s frame',
  async (structuredLayout) => {
    const uischema: ControlElement = {
      type: 'Control',
      scope: '#',
      label: 'Value editor',
      options: { structuredLayout },
    };
    const data = { name: 'Ada' };
    const { view, onchange } = await mountForm({
      schema: { type: ['object', 'null'], properties: { name: { type: 'string' } } },
      uischema,
      data,
      renderers: shadcnRenderers,
      config: { collapsed: true },
    });
    const trigger = page.getByRole('button', { name: 'Value editor', exact: true });
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
    // The type selector is a sibling, never an interactive descendant of the trigger.
    expect(
      view.container
        .querySelector('[data-mixed-collapse]')!
        .querySelector('button, select, [role="combobox"]'),
    ).toBeNull();
    await trigger.click();
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
    await view.rerender({ config: { collapsed: false, unrelated: 'change' } });
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
    await view.rerender({
      config: { jsonformsExtended: { collapsed: true, mixed: { collapsed: false } } },
    });
    // Effective configured state did not change: retain the user choice.
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
    await view.rerender({ config: { jsonformsExtended: { mixed: { collapsed: true } } } });
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
    await view.rerender({
      uischema: { ...uischema, options: { structuredLayout, collapsed: false } },
    });
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
    await view.rerender({
      uischema: { ...uischema, options: { structuredLayout, collapsed: true, collapsible: false } },
    });
    await expect.element(trigger).not.toBeInTheDocument();
    expect(view.container.querySelector('[data-mixed-frame-header]')).toBeTruthy();
    expect(onchange.mock.lastCall?.[0].data).toEqual(data);
  },
);

it.each(['nested', 'tree'])(
  'uses the selected type detail before generic detail in %s presentation',
  async (structuredLayout) => {
    const detail = (field: string) => ({
      type: 'VerticalLayout',
      elements: [{ type: 'Control', scope: '#/properties/' + field }],
    });
    const { view, onchange } = await mountForm({
      renderers: shadcnRenderers,
      schema: {
        type: ['object', 'null'],
        properties: { shown: { type: 'string' }, hidden: { type: 'string' } },
      },
      data: { shown: 'Visible value', hidden: 'Retained value' },
      uischema: {
        type: 'Control',
        scope: '#',
        options: { structuredLayout, detail: detail('hidden'), 'object-detail': detail('shown') },
      },
    });
    await expect
      .poll(() =>
        [...view.container.querySelectorAll<HTMLInputElement>('input')].map((input) => input.value),
      )
      .toContain('Visible value');
    expect(
      [...view.container.querySelectorAll<HTMLInputElement>('input')].map((input) => input.value),
    ).not.toContain('Retained value');
    expect(onchange.mock.lastCall?.[0].data).toEqual({
      shown: 'Visible value',
      hidden: 'Retained value',
    });
  },
);

it('shows descendant validation in the frame and tree without exposing hidden schema errors', async () => {
  const uischema: ControlElement = {
    type: 'Control',
    scope: '#',
    options: { structuredLayout: 'tree' },
  };
  const { view } = await mountForm({
    renderers: shadcnRenderers,
    schema: { type: ['object', 'null'], properties: { name: { type: 'string', minLength: 3 } } },
    data: { name: '' },
    uischema,
    config: {
      jsonformsExtended: { showValidationIndicator: true, showValidationIndicatorCount: true },
    },
  });
  await expect
    .poll(() => view.container.querySelectorAll('[data-container-validation-indicator]').length)
    .toBeGreaterThanOrEqual(2);
  expect(
    view.container
      .querySelector('[data-mixed-frame-header] [data-container-validation-indicator]')
      ?.textContent?.trim(),
  ).toBe('1');
  await view.rerender({ validationMode: 'ValidateAndHide' });
  await expect
    .poll(() => view.container.querySelectorAll('[data-container-validation-indicator]').length)
    .toBe(0);
  await view.rerender({
    additionalErrors: [
      {
        keyword: 'host',
        instancePath: '/name',
        schemaPath: '',
        params: {},
        message: 'Host feedback',
      },
    ],
  });
  await expect
    .poll(() => view.container.querySelectorAll('[data-container-validation-indicator]').length)
    .toBeGreaterThanOrEqual(2);
  await view.rerender({
    uischema: { ...uischema, options: { ...uischema.options, showValidationIndicator: false } },
  });
  await expect
    .poll(() => view.container.querySelectorAll('[data-container-validation-indicator]').length)
    .toBe(0);
});
