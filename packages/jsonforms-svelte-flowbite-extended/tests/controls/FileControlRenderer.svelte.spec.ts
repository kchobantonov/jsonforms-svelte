import { createCatalogTranslator } from '@chobantonov/jsonforms-svelte';
import { tick } from 'svelte';
import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
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

class DeferredReader {
  static instances: DeferredReader[] = [];
  readyState = 0;
  result: string | null = null;
  error: DOMException | null = null;
  onload: (() => void) | null = null;
  onabort: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onprogress: ((event: ProgressEvent<FileReader>) => void) | null = null;
  constructor() {
    DeferredReader.instances.push(this);
  }
  readAsDataURL() {
    this.readyState = 1;
  }
  abort = vi.fn(() => {
    this.readyState = 2;
    this.onabort?.();
  });
  complete(value: string) {
    this.result = `data:text/plain;base64,${value}`;
    this.readyState = 2;
    this.onload?.();
  }
}
const deferReads = () => {
  DeferredReader.instances = [];
  vi.stubGlobal('FileReader', DeferredReader);
};
const selectFile = (input: HTMLInputElement, name: string) => {
  assignFiles(input, [new File(['hello'], name, { type: 'text/plain' })]);
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

describe('FileControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
    vi.unstubAllGlobals();
  });

  const renderers = [fileControlRendererEntry];

  it('renders file input when no data is provided', async () => {
    const propertySchema: JsonSchema = {
      type: 'string',
      format: 'byte',
      title: 'Attachment',
    };

    const { view } = await mountControl({
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

    const { view, onchange } = await mountControl({
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

    const { view, onchange } = await mountControl({
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

  it('does not render file control for unsupported uri format', async () => {
    const propertySchema: FileJsonSchema = {
      type: 'string',
      format: 'uri',
      title: 'Attachment',
    };

    const { view } = await mountControl({
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

    const { view, onchange } = await mountControl({
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

  it('accepts unrestricted files while reporting owned size errors and preserving host errors', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'byte' },
      options: { formatMaximum: 2, restrict: false },
    });
    const onvaliditychange = vi.fn();
    const hostError = {
      keyword: 'server',
      instancePath: '/other',
      schemaPath: '',
      params: {},
      message: 'Host error',
    };
    await view.rerender({ onvaliditychange, additionalErrors: [hostError] });
    const input = view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
    const value = await uploadAndGetValue(
      input,
      onchange,
      new File(['hello'], 'large.txt', { type: 'text/plain' }),
    );
    expect(value).toBe('aGVsbG8=');
    await vi.waitFor(() => {
      const errors = onvaliditychange.mock.lastCall?.[0].additionalErrors;
      expect(errors).toEqual(
        expect.arrayContaining([
          hostError,
          expect.objectContaining({
            keyword: 'fileSize',
            instancePath: '/value',
            params: { size: 5 },
          }),
        ]),
      );
    });
    await view.rerender({
      i18n: {
        locale: 'en',
        translate: createCatalogTranslator('en', { en: { 'value.error.formatMaximum': '' } }),
      },
    });
    await vi.waitFor(() =>
      expect(onvaliditychange.mock.lastCall?.[0].additionalErrors).toEqual(
        expect.arrayContaining([expect.objectContaining({ keyword: 'fileSize', message: '' })]),
      ),
    );
    await uploadAndGetValue(input, onchange, new File(['a'], 'small.txt', { type: 'text/plain' }));
    await vi.waitFor(() =>
      expect(onvaliditychange.mock.lastCall?.[0].additionalErrors).toEqual([hostError]),
    );
  });

  it('relocates accepted file-size errors with array values and clears them on removal', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'array', items: { type: 'string', format: 'byte' } },
      value: [],
      options: { formatMaximum: 2, restrict: false },
    });
    const onvaliditychange = vi.fn();
    await view.rerender({ onvaliditychange });
    const input = view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
    assignFiles(input, [new File(['hello'], 'large.txt'), new File(['a'], 'small.txt')]);
    const before = onchange.mock.calls.length;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect((await waitForChange(onchange, before)).data.value).toEqual(['aGVsbG8=', 'YQ==']);
    await vi.waitFor(() =>
      expect(onvaliditychange.mock.lastCall?.[0].additionalErrors).toEqual([
        expect.objectContaining({ keyword: 'fileSize', instancePath: '/value/0' }),
      ]),
    );
    await view.rerender({ data: { value: ['YQ==', 'aGVsbG8='] } });
    await vi.waitFor(() =>
      expect(onvaliditychange.mock.lastCall?.[0].additionalErrors).toEqual([
        expect.objectContaining({ keyword: 'fileSize', instancePath: '/value/1' }),
      ]),
    );
    await view.rerender({ data: { value: ['YQ=='] } });
    await vi.waitFor(() =>
      expect(onvaliditychange.mock.lastCall?.[0].additionalErrors).toEqual([]),
    );
  });

  it('publishes pending reads and clears pending after external replacement', async () => {
    deferReads();
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'byte' },
      value: 'b2xk',
    });
    const onvaliditychange = vi.fn();
    await view.rerender({ onvaliditychange });
    const input = view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
    assignFiles(input, [new File(['hello'], 'pending.txt')]);
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await vi.waitFor(() => expect(onvaliditychange.mock.lastCall?.[0].pending).toBe(true));
    await view.rerender({ data: { value: 'YQ==' } });
    await vi.waitFor(() => expect(onvaliditychange.mock.lastCall?.[0].pending).toBe(false));
    const before = onchange.mock.calls.length;
    DeferredReader.instances[0].complete('aGVsbG8=');
    await tick();
    expect(onchange.mock.calls.length).toBe(before);
  });

  it('shows local warning for file exceeding maximum size and does not update core data', async () => {
    const propertySchema: JsonSchema = {
      type: 'string',
      format: 'byte',
      title: 'Attachment',
    };

    const { view, onchange } = await mountControl({
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
      const alert = view.container.querySelector<HTMLElement>('[role="status"]');
      expect(alert).toBeTruthy();
      expect((alert?.textContent ?? '').toLowerCase().includes('size should be less than')).toBe(
        true,
      );
    });

    expect(onchange.mock.calls.length).toBe(before);
  });
  it('only commits the latest selection when file reads finish out of order', async () => {
    deferReads();
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'byte' },
      value: 'b2xk',
    });
    const input = view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
    selectFile(input, 'first.txt');
    const first = DeferredReader.instances[0];
    const lateLoad = first.onload!;
    selectFile(input, 'second.txt');
    expect(first.abort).toHaveBeenCalledOnce();
    DeferredReader.instances[1].complete('bmV3');
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBe('bmV3'));
    first.result = 'data:text/plain;base64,c3RhbGU=';
    lateLoad();
    await tick();
    expect(onchange.mock.lastCall?.[0].data.value).toBe('bmV3');
  });

  it.each(['readonly', 'data', 'schema'] as const)(
    'cancels a pending read after an external %s change',
    async (change) => {
      deferReads();
      const { view, onchange } = await mountControl({
        renderers,
        propertySchema: { type: 'string', format: 'byte' },
        value: 'b2xk',
      });
      const input = view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
      selectFile(input, 'pending.txt');
      const reader = DeferredReader.instances[0];
      const lateLoad = reader.onload!;
      if (change === 'readonly')
        await view.rerender({ readonly: true, config: { separateReadonlyFromDisabled: true } });
      else if (change === 'data') await view.rerender({ data: { value: 'ZXh0ZXJuYWw=' } });
      else
        await view.rerender({
          schema: { type: 'object', properties: { value: { type: 'string', format: 'binary' } } },
        });
      await vi.waitFor(() => expect(reader.abort).toHaveBeenCalledOnce());
      reader.result = 'data:text/plain;base64,c3RhbGU=';
      lateLoad();
      await tick();
      expect(onchange.mock.lastCall?.[0].data.value).toBe(
        change === 'data' ? 'ZXh0ZXJuYWw=' : 'b2xk',
      );
      if (change === 'readonly') {
        selectFile(input, 'blocked.txt');
        expect(DeferredReader.instances).toHaveLength(1);
      }
    },
  );

  it('aborts on unmount and does not dispatch a late result', async () => {
    deferReads();
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'byte' },
      value: 'b2xk',
    });
    const input = view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
    selectFile(input, 'pending.txt');
    const reader = DeferredReader.instances[0];
    const lateLoad = reader.onload!;
    await tick();
    const calls = onchange.mock.calls.length;
    await cleanup();
    expect(reader.abort).toHaveBeenCalledOnce();
    reader.result = 'data:text/plain;base64,c3RhbGU=';
    lateLoad();
    await tick();
    expect(onchange).toHaveBeenCalledTimes(calls);
  });
  it('localizes progress and clears the value when the user cancels', async () => {
    deferReads();
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'byte' },
      value: 'b2xk',
      options: { clearable: true },
    });
    await view.rerender({ i18n: { locale: 'bg-BG' } });
    expect(view.container.querySelector('[aria-label="Изчистване на стойността"]')).toBeTruthy();
    const input = view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
    selectFile(input, 'pending.txt');
    await vi.waitFor(() => expect(document.body.textContent).toContain('Прикачване на файл...'));
    const progress = document.querySelector('[role="progressbar"]');
    expect(progress).toBeTruthy();
    expect(progress!.getAttribute('aria-label')).toBe('Прикачване на файл...');
    expect(progress!.getAttribute('aria-valuenow')).toBeNull();
    expect(progress!.getAttribute('aria-valuetext')).toBe('Прикачване на файл...');
    DeferredReader.instances[0].onprogress!(
      new ProgressEvent('progress', {
        lengthComputable: true,
        loaded: 1,
        total: 4,
      }) as ProgressEvent<FileReader>,
    );
    await vi.waitFor(() =>
      expect(document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe(
        '25',
      ),
    );
    expect(document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuetext')).toBe(
      '25%',
    );
    const cancel = Array.from(document.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Отказ',
    );
    expect(cancel).toBeTruthy();
    cancel!.click();
    await vi.waitFor(() => expect(DeferredReader.instances[0].abort).toHaveBeenCalledOnce());
    expect(onchange.mock.lastCall?.[0].data.value).toBeUndefined();
  });

  it('cancels the read when the native progress dialog is dismissed', async () => {
    deferReads();
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'byte' },
      value: 'b2xk',
    });
    selectFile(
      view.container.querySelector<HTMLInputElement>('input[type="file"]')!,
      'pending.txt',
    );
    await vi.waitFor(() => expect(document.querySelector('dialog[open]')).toBeTruthy());
    document
      .querySelector('dialog[open]')!
      .dispatchEvent(new Event('cancel', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(DeferredReader.instances[0].abort).toHaveBeenCalledOnce());
    expect(onchange.mock.lastCall?.[0].data.value).toBeUndefined();
  });
  it('clears on native chooser cancellation and ignores cancellation when readonly', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'byte' },
      value: 'b2xk',
    });
    const input = view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
    input.dispatchEvent(new Event('cancel', { bubbles: true }));
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBeUndefined());
    await view.rerender({ data: { value: 'ZXh0ZXJuYWw=' }, readonly: true });
    input.dispatchEvent(new Event('cancel', { bubbles: true }));
    await tick();
    expect(onchange.mock.lastCall?.[0].data.value).toBe('ZXh0ZXJuYWw=');
  });
  it.each(['', '.pdf'])(
    'preserves explicit accept=%s over the schema MIME hint',
    async (accept) => {
      const { view } = await mountControl({
        renderers,
        propertySchema: {
          type: 'string',
          format: 'byte',
          contentMediaType: 'image/png',
        } as FileJsonSchema,
        options: { accept },
      });
      expect(view.container.querySelector<HTMLInputElement>('input[type="file"]')!.accept).toBe(
        accept,
      );
    },
  );
  it('derives persisted names from data and updates localized fallback after replacement', async () => {
    const name = 'report №1.txt';
    const stored = `data:text/plain;filename=${encodeURIComponent(name)};base64,aGVsbG8=`;
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'binary' },
      value: stored,
    });
    expect(view.container.textContent).toContain(name);
    await view.rerender({ data: { value: 'aGVsbG8=' }, i18n: { locale: 'bg' } });
    expect(view.container.textContent).toContain('Прикачен файл');
    expect(view.container.textContent).not.toContain(name);
    await view.rerender({ i18n: { locale: 'en' } });
    expect(view.container.textContent).toContain('File attached');
    expect(onchange.mock.lastCall?.[0].data.value).toBe('aGVsbG8=');
  });

  it('keeps the committed local filename when a replacement is rejected', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'byte' },
      options: { formatMaximum: 5 },
    });
    const input = view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
    const accepted = await uploadAndGetValue(
      input,
      onchange,
      new File(['ok'], 'accepted.txt', { type: 'text/plain' }),
    );
    expect(view.container.textContent).toContain('accepted.txt');
    assignFiles(input, [new File(['too large'], 'rejected.txt', { type: 'text/plain' })]);
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await tick();
    expect(view.container.textContent).toContain('accepted.txt');
    expect(view.container.textContent).not.toContain('rejected.txt');
    expect(onchange.mock.lastCall?.[0].data.value).toBe(accepted);
  });
  it('appends a complete batch in chooser order and removes one duplicate occurrence', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'array', items: { type: 'string', format: 'byte' } },
      value: ['aGVsbG8='],
    });
    const input = view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(input.multiple).toBe(true);
    assignFiles(input, [new File(['hello'], 'second.txt'), new File(['world'], 'third.txt')]);
    const before = onchange.mock.calls.length;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect((await waitForChange(onchange, before)).data.value).toEqual([
      'aGVsbG8=',
      'aGVsbG8=',
      'd29ybGQ=',
    ]);
    await vi.waitFor(() => expect(view.container.textContent).toContain('second.txt'));
    const remove = view.container.querySelector<HTMLButtonElement>(
      '[aria-label="Remove file: second.txt"]',
    )!;
    const beforeRemove = onchange.mock.calls.length;
    remove.click();
    expect((await waitForChange(onchange, beforeRemove)).data.value).toEqual([
      'aGVsbG8=',
      'd29ybGQ=',
    ]);
    await vi.waitFor(() => expect(view.container.textContent).toContain('third.txt'));
    expect(view.container.textContent).not.toContain('second.txt');
  });

  it('deduplicates encoded values before enforcing maxItems', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: {
        type: 'array',
        items: { type: 'string', format: 'byte' },
        uniqueItems: true,
        maxItems: 1,
      },
      value: ['aGVsbG8='],
    });
    const input = view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
    assignFiles(input, [new File(['hello'], 'same.txt'), new File(['world'], 'extra.txt')]);
    const before = onchange.mock.calls.length;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await vi.waitFor(() => expect(view.container.textContent).toContain('Too many files selected'));
    expect(onchange.mock.calls.length).toBe(before);
    assignFiles(input, [new File(['hello'], 'same.txt')]);
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await vi.waitFor(() =>
      expect(view.container.textContent).not.toContain('Too many files selected'),
    );
    await vi.waitFor(() => expect(input.value).toBe(''));
    expect(view.container.querySelectorAll('li')).toHaveLength(1);
  });

  it('uses authored restrict precedence for array count limits and clear', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: {
        type: 'array',
        items: { type: 'string', format: 'byte' },
        minItems: 1,
        maxItems: 1,
      },
      value: ['aGVsbG8='],
    });
    const input = view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(input.disabled).toBe(false);
    expect(
      view.container.querySelector<HTMLButtonElement>('[aria-label="Clear value"]')!.disabled,
    ).toBe(true);
    expect(
      view.container.querySelector<HTMLButtonElement>('[aria-label^="Remove file:"]')!.disabled,
    ).toBe(true);
    await view.rerender({ config: { restrict: false } });
    assignFiles(input, [new File(['world'], 'world.txt')]);
    const before = onchange.mock.calls.length;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    const result = await waitForChange(onchange, before);
    expect(result.data.value).toEqual(['aGVsbG8=', 'd29ybGQ=']);
    expect(result.errors.length).toBeGreaterThan(0);
    await view.rerender({
      uischema: { type: 'Control', scope: '#/properties/value', options: { restrict: true } },
    });
    expect(
      view.container.querySelector<HTMLButtonElement>('[aria-label="Clear value"]')!.disabled,
    ).toBe(true);
    await view.rerender({
      uischema: { type: 'Control', scope: '#/properties/value', options: { restrict: false } },
      i18n: { locale: 'bg' },
    });
    const beforeClear = onchange.mock.calls.length;
    view.container
      .querySelector<HTMLButtonElement>('[aria-label="Изчистване на стойността"]')!
      .click();
    expect((await waitForChange(onchange, beforeClear)).data.value).toEqual([]);
  });

  it('discards the whole batch when a later file fails', async () => {
    deferReads();
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { view, onchange } = await mountControl({
        renderers,
        propertySchema: { type: 'array', items: { type: 'string', format: 'byte' } },
        value: ['existing'],
      });
      const input = view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
      assignFiles(input, [new File(['one'], 'one.txt'), new File(['two'], 'two.txt')]);
      const before = onchange.mock.calls.length;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      DeferredReader.instances[0].complete('b25l');
      await vi.waitFor(() => expect(DeferredReader.instances).toHaveLength(2));
      expect(onchange.mock.calls.length).toBe(before);
      DeferredReader.instances[1].error = new DOMException('Unreadable');
      DeferredReader.instances[1].onerror?.();
      await vi.waitFor(() =>
        expect(view.container.textContent).toContain('Failed to process file'),
      );
      expect(onchange.mock.calls.length).toBe(before);
      expect(view.container.querySelectorAll('li')).toHaveLength(1);
    } finally {
      logged.mockRestore();
    }
  });
  it('resolves referenced file items and guards array removal while readonly or not clearable', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'array', items: { type: 'string', format: 'binary' } },
      value: ['data:text/plain;filename=saved.txt;base64,YQ=='],
    });
    await view.rerender({
      schema: {
        type: 'object',
        definitions: { attachment: { type: 'string', format: 'binary' } },
        properties: { value: { type: 'array', items: { $ref: '#/definitions/attachment' } } },
      },
      readonly: true,
    });
    const input = view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(input.multiple).toBe(true);
    expect(input.disabled).toBe(true);
    const before = onchange.mock.calls.length;
    assignFiles(input, [new File(['ignored'], 'ignored.txt')]);
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('cancel', { bubbles: true }));
    await tick();
    expect(onchange.mock.calls.length).toBe(before);
    expect(view.container.textContent).toContain('saved.txt');
    expect(view.container.querySelector('[aria-label^="Remove file:"]')).toBeNull();
    await view.rerender({
      readonly: false,
      uischema: { type: 'Control', scope: '#/properties/value', options: { clearable: false } },
    });
    expect(input.disabled).toBe(false);
    expect(view.container.querySelector('[aria-label^="Remove file:"]')).toBeNull();
    expect(view.container.querySelector('[aria-label="Clear value"]')).toBeNull();
  });
  it('keeps rejected selections local and clears feedback after an external value replacement', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'byte' },
      value: 'YQ==',
      options: { formatMaximum: 1 },
    });
    const input = view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
    const before = onchange.mock.calls.length;
    selectFile(input, 'too-large.txt');
    await vi.waitFor(() =>
      expect(view.container.querySelector('[role="status"]')?.textContent).toContain('size'),
    );
    expect(input.getAttribute('aria-invalid')).not.toBe('true');
    expect(onchange.mock.calls.length).toBe(before);
    await view.rerender({ data: { value: 'Yg==' } });
    expect(view.container.querySelector('[role="status"]')).toBeNull();
  });
  it('uses a localized native picker button to activate the hidden platform input', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'byte', title: 'Attachment' },
    });
    await view.rerender({ i18n: { locale: 'bg' } });
    const input = view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(input.closest('[hidden]')).toBeTruthy();
    const picker = view.container.querySelector<HTMLButtonElement>(
      'button[aria-label="Attachment: Избор на файл"]',
    )!;
    expect(picker).toBeTruthy();
    expect(picker.textContent).toContain('Избор на файл');
    const activate = vi.spyOn(input, 'click').mockImplementation(() => {});
    picker.click();
    expect(activate).toHaveBeenCalledTimes(1);
    await view.rerender({ readonly: true });
    expect(picker.disabled).toBe(true);
    picker.click();
    expect(activate).toHaveBeenCalledTimes(1);
    activate.mockRestore();
  });
});
