import { expect, vi } from 'vite-plus/test';

type ChangeEvent = {
  data: { value?: unknown };
  errors: unknown[];
};

type FormChangeEvent = {
  data: Record<string, unknown>;
  errors: unknown[];
};

export function changeWaiters(timeout: number) {
  async function waitForEvent<Event>(onchange: ReturnType<typeof vi.fn>, previousCalls: number) {
    await vi.waitFor(() => expect(onchange.mock.calls.length).toBeGreaterThan(previousCalls), {
      timeout,
    });
    return onchange.mock.lastCall?.[0] as Event;
  }
  return {
    waitForChange: waitForEvent<ChangeEvent>,
    waitForFormChange: waitForEvent<FormChangeEvent>,
  };
}

export const getBySelector = <T extends Element>(container: HTMLElement, selector: string): T => {
  const element = container.querySelector(selector);
  expect(element).toBeTruthy();
  return element as T;
};

export const expectValidationError = (container: HTMLElement) => {
  const input = getBySelector<HTMLElement>(container, '[aria-invalid]');
  expect(input.getAttribute('aria-invalid')).toBe('true');
  const validationMessage = getBySelector<HTMLElement>(container, '[role="alert"]');
  expect((validationMessage.textContent ?? '').trim().length).toBeGreaterThan(0);
};

export const checkCellValidationError = (
  container: HTMLElement,
  attribute: 'title' | 'aria-label',
) => {
  const input = getBySelector<HTMLElement>(container, '[aria-invalid]');
  expect(input.getAttribute('aria-invalid')).toBe('true');
  const validationButton = getBySelector<HTMLButtonElement>(
    container,
    'button[aria-label^="Validation error:"]',
  );
  if (attribute === 'title') expect(validationButton.title.trim().length).toBeGreaterThan(0);
  else expect(validationButton.getAttribute('aria-label')?.length).toBeGreaterThan(18);
};

export const expectLabelVisible = (container: HTMLElement, expectedLabel: string) => {
  const nonEmptyLabels = Array.from(container.querySelectorAll('label'))
    .map((label) => (label.textContent ?? '').trim())
    .filter((label) => label.length > 0);
  expect(nonEmptyLabels.some((label) => label === expectedLabel)).toBe(true);
};

export const getButtonByText = (container: HTMLElement, text: string): HTMLButtonElement => {
  const expected = text.trim().toLowerCase();
  const buttons = Array.from(container.querySelectorAll('button'));
  const button =
    buttons.find((candidate) => (candidate.textContent ?? '').trim().toLowerCase() === expected) ??
    buttons.find((candidate) =>
      (candidate.textContent ?? '').trim().toLowerCase().includes(expected),
    );

  expect(button).toBeTruthy();
  return button as HTMLButtonElement;
};

export const getTabByText = (container: HTMLElement, text: string): HTMLButtonElement => {
  const expected = text.trim().toLowerCase();
  const tabs = Array.from(container.querySelectorAll<HTMLButtonElement>('button[role="tab"]'));
  const tab =
    tabs.find((candidate) => (candidate.textContent ?? '').trim().toLowerCase() === expected) ??
    tabs.find((candidate) => (candidate.textContent ?? '').trim().toLowerCase().includes(expected));

  expect(tab).toBeTruthy();
  return tab as HTMLButtonElement;
};

export const getInputByLabel = (container: HTMLElement, labelText: string): HTMLInputElement => {
  const label = Array.from(container.querySelectorAll<HTMLLabelElement>('label')).find(
    (candidate) => {
      return (candidate.textContent ?? '').trim() === labelText;
    },
  );
  expect(label).toBeTruthy();

  const id = label?.getAttribute('for');
  expect(id).toBeTruthy();

  const input = container.querySelector<HTMLInputElement>(`#${CSS.escape(id as string)}`);
  expect(input).toBeTruthy();
  return input as HTMLInputElement;
};
