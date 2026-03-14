import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { fileControlRendererEntry } from '../../src/lib/controls';
import { expectLabelVisible, mountControl, waitForChange } from '../testUtils';

type FileJsonSchema = JsonSchema & {
  contentEncoding?: string;
};

const assignFiles = (input: HTMLInputElement, files: File[]) => {
  const dataTransfer = new DataTransfer();
  files.forEach((file) => dataTransfer.items.add(file));

  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'files');
  if (descriptor?.set) {
    descriptor.set.call(input, dataTransfer.files);
    return;
  }

  Object.defineProperty(input, 'files', {
    value: dataTransfer.files,
    configurable: true,
    writable: true,
  });
};

const uploadAndGetValue = async (
  input: HTMLInputElement,
  onchange: ReturnType<typeof vi.fn>,
  file: File,
) => {
  assignFiles(input, [file]);
  const before = onchange.mock.calls.length;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  const changeEvent = await waitForChange(onchange, before);
  return changeEvent.data.value as string;
};

describe('FileControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [fileControlRendererEntry];

  it('renders file input when no data is provided', () => {
    const propertySchema: JsonSchema = {
      type: 'string',
      format: 'byte',
      title: 'Attachment',
    };

    const { view } = mountControl({
      renderers,
      propertySchema,
    });

    const input = view.container.querySelector<HTMLInputElement>(
      'input[type="file"][id$="-input"]',
    );
    expect(input).toBeTruthy();
    expect(input?.value).toBe('');
    expectLabelVisible(view.container, 'Attachment');
  });

  it('returns base64 payload for byte format', async () => {
    const propertySchema: FileJsonSchema = {
      type: 'string',
      format: 'byte',
      title: 'Attachment',
    };

    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
    });

    const input = view.container.querySelector<HTMLInputElement>(
      'input[type="file"][id$="-input"]',
    );
    expect(input).toBeTruthy();
    expect(input?.value).toBe('');

    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    const value = await uploadAndGetValue(input!, onchange, file);

    expect(value).toBe('aGVsbG8=');
  });

  it('returns base64 payload for contentEncoding=base64 schema', async () => {
    const propertySchema: FileJsonSchema = {
      type: 'string',
      contentEncoding: 'base64',
      title: 'Attachment',
    };

    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
    });

    const input = view.container.querySelector<HTMLInputElement>(
      'input[type="file"][id$="-input"]',
    );
    expect(input).toBeTruthy();
    expect(input?.value).toBe('');

    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    const value = await uploadAndGetValue(input!, onchange, file);

    expect(value).toBe('aGVsbG8=');
  });

  it('does not render file control for unsupported uri format', () => {
    const propertySchema: FileJsonSchema = {
      type: 'string',
      format: 'uri',
      title: 'Attachment',
    };

    const { view } = mountControl({
      renderers,
      propertySchema,
    });

    const input = view.container.querySelector<HTMLInputElement>(
      'input[type="file"][id$="-input"]',
    );
    expect(input).toBeNull();
  });

  it('embeds encoded filename for binary format', async () => {
    const propertySchema: FileJsonSchema = {
      type: 'string',
      format: 'binary',
      title: 'Attachment',
    };

    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
    });

    const input = view.container.querySelector<HTMLInputElement>(
      'input[type="file"][id$="-input"]',
    );
    expect(input).toBeTruthy();
    expect(input?.value).toBe('');

    const file = new File(['hello'], 'my file#.txt', { type: 'text/plain' });
    const value = await uploadAndGetValue(input!, onchange, file);

    expect(value).toBe('data:text/plain;filename=my%20file%23.txt;base64,aGVsbG8=');
  });

  it('shows validation error for file exceeding maximum size and does not update core data', async () => {
    const propertySchema: JsonSchema = {
      type: 'string',
      format: 'byte',
      title: 'Attachment',
    };

    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
      options: { formatMaximum: 2 },
    });

    const input = view.container.querySelector<HTMLInputElement>(
      'input[type="file"][id$="-input"]',
    );
    expect(input).toBeTruthy();

    const file = new File(['hello'], 'too-big.txt', { type: 'text/plain' });
    assignFiles(input!, [file]);

    const before = onchange.mock.calls.length;
    input!.dispatchEvent(new Event('change', { bubbles: true }));

    await vi.waitFor(() => {
      const alert = view.container.querySelector<HTMLElement>('[role="alert"]');
      expect(alert).toBeTruthy();
      expect((alert?.textContent ?? '').toLowerCase().includes('size should be less than')).toBe(
        true,
      );
    });

    expect(onchange.mock.calls.length).toBe(before);
  });
});
