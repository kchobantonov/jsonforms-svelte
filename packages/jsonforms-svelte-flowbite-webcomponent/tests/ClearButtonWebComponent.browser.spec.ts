import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/lib/webcomponent-register.js';

let element: HTMLElement | undefined;
afterEach(() => element?.remove());

describe('Flowbite clear buttons in shadow DOM', () => {
  it.each(['light', 'dark'])('centers clear buttons and clears values in %s mode', async (mode) => {
    element = document.createElement('jsonforms-svelte-flowbite');
    Object.assign(element, {
      mode,
      schema: {
        type: 'object',
        properties: { name: { type: 'string' }, age: { type: 'integer' } },
      },
      data: { name: 'Ada', age: 37 },
    });
    const changes = vi.fn();
    element.addEventListener('change', (event) => {
      if (event instanceof CustomEvent) changes(event.detail);
    });
    document.body.append(element);

    let clearButtons: HTMLButtonElement[] = [];
    await vi.waitFor(() => {
      const root = element!.shadowRoot!;
      const inputs = Array.from(root.querySelectorAll<HTMLInputElement>('input'));
      clearButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).filter(
        (button) => button.classList.contains('-translate-y-1/2'),
      );
      expect(inputs).toHaveLength(2);
      expect(clearButtons).toHaveLength(2);
      for (let index = 0; index < inputs.length; index += 1) {
        const input = inputs[index].getBoundingClientRect();
        const button = clearButtons[index].getBoundingClientRect();
        expect(input.height).toBeGreaterThan(0);
        expect(getComputedStyle(clearButtons[index]).translate).not.toBe('none');
        expect(
          Math.abs(input.top + input.height / 2 - button.top - button.height / 2),
        ).toBeLessThanOrEqual(1);
      }
    });

    clearButtons[0].click();
    await vi.waitFor(() => {
      expect(
        changes.mock.calls.some(
          ([change]) => change.data?.name === undefined && change.data?.age === 37,
        ),
      ).toBe(true);
    });
  });
});
