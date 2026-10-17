import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import Wrapper from './JsonFormsWebComponentWrapper.svelte';

// The wrapper owns event forwarding; packaged-element behavior is covered by
// the packed browser tests. Avoid loading another full renderer bundle here.
vi.mock('$app/paths', () => ({ asset: () => 'data:text/javascript,export{}' }));

describe('Web Component validity forwarding', () => {
  it('forwards errors without a data edit and removes listeners on unmount', async () => {
    const onvaliditychange = vi.fn();
    const onchange = vi.fn();
    const view = render(Wrapper, { onvaliditychange, onchange });
    let element: Element;
    await vi.waitFor(() => {
      element = document.querySelector('jsonforms-svelte-skeleton')!;
      expect(element).not.toBeNull();
    });
    await tick();
    const detail = {
      errors: [],
      additionalErrors: [
        {
          instancePath: '/contact/email',
          schemaPath: '',
          keyword: 'server',
          params: {},
          message: 'Already registered',
        },
      ],
      pending: false,
      valid: false,
    };
    const publish = () => element.dispatchEvent(new CustomEvent('validity-change', { detail }));
    publish();
    expect(onvaliditychange).toHaveBeenCalledExactlyOnceWith(detail);
    expect(onchange).not.toHaveBeenCalled();
    await view.unmount();
    publish();
    expect(onvaliditychange).toHaveBeenCalledTimes(1);
  });
});

it('preserves trusted native functions in UI schema properties', async () => {
  const tag = 'jsonforms-svelte-skeleton';
  if (!customElements.get(tag)) {
    customElements.define(
      tag,
      class extends HTMLElement {
        private currentUiSchema: unknown;
        private currentUiSchemas: unknown;
        get uischema() {
          return this.currentUiSchema;
        }
        set uischema(value: unknown) {
          this.currentUiSchema = value;
        }
        get uischemas() {
          return this.currentUiSchemas;
        }
        set uischemas(value: unknown) {
          this.currentUiSchemas = value;
        }
      },
    );
  }
  const script = vi.fn();
  const tester = vi.fn(() => 10);
  const view = render(Wrapper, {
    uischema: { type: 'Button', script },
    uischemas: [{ tester, uischema: { type: 'Control', scope: '#' } }],
  });
  try {
    await vi.waitFor(() => {
      const element = document.querySelector(tag) as
        | (HTMLElement & {
            uischema: { script: unknown };
            uischemas: { tester: unknown }[];
          })
        | null;
      expect(element?.uischema?.script).toBe(script);
      expect(element?.uischemas?.[0].tester).toBe(tester);
    });
  } finally {
    await view.unmount();
  }
});

it('ignores native and nested change events while forwarding host document changes', async () => {
  const onchange = vi.fn();
  const view = render(Wrapper, { onchange });
  try {
    let element: Element;
    await vi.waitFor(() => {
      element = document.querySelector('jsonforms-svelte-skeleton')!;
      expect(element).not.toBeNull();
    });
    await tick();
    const input = document.createElement('input');
    element!.append(input);
    input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    input.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { value: 'draft' } }));
    expect(onchange).not.toHaveBeenCalled();
    const detail = { data: { name: 'Committed' }, errors: [] };
    element!.dispatchEvent(new CustomEvent('change', { detail }));
    expect(onchange).toHaveBeenCalledExactlyOnceWith(detail);
  } finally {
    await view.unmount();
  }
});
