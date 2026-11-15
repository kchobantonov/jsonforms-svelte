import { afterEach, expect, it, vi } from 'vite-plus/test';
import { TRUST_DYNAMIC_FUNCTIONS } from '../src/lib/webcomponent-entry';

let element: HTMLElement | undefined;
afterEach(() => element?.remove());

it('uses config activation, independent external input, and the exported capability', async () => {
  element = document.createElement('jsonforms-svelte-shadcn');
  Object.assign(element, {
    schema: { type: 'object' },
    data: {},
    uischema: { type: 'Label', text: 'Static', $dynamic: { text: { bind: 'external.title' } } },
    external: { title: 'First' },
  });
  document.body.append(element);
  const content = () => element!.shadowRoot!.textContent;
  await vi.waitFor(() => expect(content()).toContain('Static'));
  element.setAttribute(
    'config',
    JSON.stringify({ jsonformsExtended: { dynamic: { enabled: true } } }),
  );
  await vi.waitFor(() => expect(content()).toContain('First'));
  element.setAttribute('external', JSON.stringify({ title: 'Second' }));
  await vi.waitFor(() => expect(content()).toContain('Second'));
  let calls = 0;
  Object.assign(element, {
    config: { jsonformsExtended: { dynamic: { enabled: true, trusted: TRUST_DYNAMIC_FUNCTIONS } } },
    uischema: {
      type: 'Label',
      text: 'Static',
      $dynamic: {
        text: () => {
          calls++;
          return 'Trusted';
        },
      },
    },
  });
  await vi.waitFor(() => expect(content()).toContain('Trusted'));
  expect(calls).toBeGreaterThan(0);
  Object.assign(element, { config: { jsonformsExtended: { dynamic: { enabled: false } } } });
  await vi.waitFor(() => expect(content()).toContain('Static'));
});
