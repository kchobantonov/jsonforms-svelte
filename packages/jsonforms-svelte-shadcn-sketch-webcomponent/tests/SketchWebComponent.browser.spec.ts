import { afterEach, expect, it, vi } from 'vite-plus/test';
import '../src/lib/webcomponent-register.js';

let element: HTMLElement | undefined;
afterEach(() => element?.remove());

it('renders the same editable form with stable Rough.js outlines in light and dark modes', async () => {
  element = document.createElement('jsonforms-svelte-shadcn-sketch');
  Object.assign(element, {
    mode: 'light',
    schema: { type: 'object', properties: { name: { type: 'string' } } },
    uischema: { type: 'Control', scope: '#/properties/name' },
    data: { name: '' },
  });
  const changes: Array<{ data: { name: string } }> = [];
  element.addEventListener('change', (event) => {
    if (event instanceof CustomEvent) changes.push(event.detail);
  });
  document.body.append(element);
  const input = await vi.waitFor(() => {
    const node = element?.shadowRoot?.querySelector<HTMLInputElement>('[data-slot="input"]');
    expect(node).not.toBeNull();
    return node!;
  });
  await vi.waitFor(() => expect(input.dataset.sketchOutline).toBe(''));
  const overlay = input.parentElement?.querySelector<SVGSVGElement>('svg[data-sketch-overlay]');
  expect(overlay).not.toBeNull();
  const before = overlay!.innerHTML;
  const inputBounds = input.getBoundingClientRect();
  const overlayBounds = overlay!.getBoundingClientRect();
  expect(Math.abs(inputBounds.left - overlayBounds.left)).toBeLessThan(1);
  expect(Math.abs(inputBounds.width - overlayBounds.width)).toBeLessThan(1);
  input.value = 'Ada';
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await vi.waitFor(() => expect(changes.at(-1)?.data.name).toBe('Ada'));
  expect(overlay!.innerHTML).toBe(before);
  const light = getComputedStyle(input).backgroundColor;
  Object.assign(element, { mode: 'dark' });
  await vi.waitFor(() => expect(element?.getAttribute('data-mode')).toBe('dark'));
  await vi.waitFor(() => expect(getComputedStyle(input).backgroundColor).not.toBe(light));
  await vi.waitFor(() => expect(overlay!.querySelector('path')?.getAttribute('stroke')).toBe('#f3ead3'));
});

it('keeps a hidden clear button outline hidden with its button', async () => {
  element = document.createElement('jsonforms-svelte-shadcn-sketch');
  Object.assign(element, {
    schema: { type: 'object', properties: { language: { type: 'string', enum: ['JSON', 'JavaScript'] } } },
    uischema: { type: 'Control', scope: '#/properties/language', options: { clearable: true } },
    data: { language: 'JSON' },
  });
  document.body.append(element);
  const clear = await vi.waitFor(() => {
    const button = element?.shadowRoot?.querySelector<HTMLButtonElement>('button.opacity-0[aria-label]');
    expect(button).not.toBeNull();
    return button!;
  });
  await vi.waitFor(() => expect(clear.querySelector('svg[data-sketch-overlay]')).not.toBeNull());
  expect(clear.querySelector('svg[data-sketch-overlay]')?.parentElement).toBe(clear);
  await vi.waitFor(() => expect(getComputedStyle(clear).opacity).toBe('0')); 
});

it('draws an empty square and adds an ink check only when selected', async () => {
  element = document.createElement('jsonforms-svelte-shadcn-sketch');
  Object.assign(element, {
    schema: { type: 'object', properties: { approved: { type: 'boolean' } } },
    uischema: { type: 'Control', scope: '#/properties/approved' },
    data: { approved: false },
  });
  document.body.append(element);
  const checkbox = await vi.waitFor(() => {
    const node = element?.shadowRoot?.querySelector<HTMLElement>('[data-slot="checkbox"]');
    expect(node).not.toBeNull();
    return node!;
  });
  const overlay = await vi.waitFor(() => {
    const node = checkbox.parentElement?.querySelector<SVGSVGElement>('svg[data-sketch-overlay]');
    expect(node).not.toBeNull();
    return node!;
  });
  const emptyPaths = overlay.querySelectorAll('path').length;
  expect(checkbox.getAttribute('aria-checked')).toBe('false');
  checkbox.click();
  await vi.waitFor(() => expect(checkbox.getAttribute('aria-checked')).toBe('true'));
  await vi.waitFor(() => expect(overlay.querySelectorAll('path').length).toBeGreaterThan(emptyPaths));
  expect(getComputedStyle(checkbox.querySelector('[data-slot="checkbox-indicator"]')!).visibility).toBe('hidden');
  Object.assign(element, { mode: 'dark' });
  await vi.waitFor(() => expect(overlay.querySelector('path')?.getAttribute('stroke')).toBe('#f3ead3'));
  checkbox.click();
  await vi.waitFor(() => expect(checkbox.getAttribute('aria-checked')).toBe('false'));
  await vi.waitFor(() => expect(overlay.querySelectorAll('path').length).toBe(emptyPaths));
});
