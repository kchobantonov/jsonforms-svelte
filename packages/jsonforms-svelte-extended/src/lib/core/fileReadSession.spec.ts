import { expect, it, vi } from 'vite-plus/test';
import { createFileReadSession } from './fileReadSession';

class Reader {
  readyState = 0;
  result: string | null = null;
  error: DOMException | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  onprogress: ((event: ProgressEvent<FileReader>) => void) | null = null;
  readAsDataURL = vi.fn(() => {
    this.readyState = 1;
  });
  abort = vi.fn(() => {
    this.readyState = 2;
    this.onabort?.();
  });
  complete(value = 'data:text/plain;base64,aGVsbG8=') {
    this.result = value;
    this.readyState = 2;
    this.onload?.();
  }
}
const setup = () => {
  const readers: Reader[] = [];
  const session = createFileReadSession(() => {
    const reader = new Reader();
    readers.push(reader);
    return reader as unknown as FileReader;
  });
  return { session, readers };
};
const file = new File(['hello'], 'my file#.txt', { type: 'text/plain' });

it.each([
  ['byte', 'aGVsbG8='],
  [undefined, 'aGVsbG8='],
  ['uri', 'data:text/plain;base64,aGVsbG8='],
  ['binary', 'data:text/plain;filename=my%20file%23.txt;base64,aGVsbG8='],
])('preserves the %s storage representation', async (format, expected) => {
  const { session, readers } = setup();
  const request = session.read(file, format, vi.fn());
  readers[0].complete();
  expect(await request.result).toBe(expected);
  expect(request.isCurrent()).toBe(true);
  expect(session.pending).toBe(false);
  expect(readers[0].onload).toBeNull();
});

it('cancels replacement reads and ignores late load/progress callbacks', async () => {
  const { session, readers } = setup();
  const progress = vi.fn();
  const first = session.read(file, 'byte', progress);
  const settled = first.result.catch((error: DOMException) => error.name);
  const oldLoad = readers[0].onload!;
  const oldProgress = readers[0].onprogress!;
  const second = session.read(file, 'byte', progress);
  oldLoad();
  oldProgress({ loaded: 1, total: 1, lengthComputable: true } as ProgressEvent<FileReader>);
  expect(await settled).toBe('AbortError');
  expect(readers[0].abort).toHaveBeenCalledOnce();
  expect(first.isCurrent()).toBe(false);
  expect(progress).not.toHaveBeenCalled();
  expect(session.pending).toBe(true);
  readers[1].complete('data:text/plain;base64,bmV3');
  expect(await second.result).toBe('bmV3');
});

it('invalidates a resolved request before its consumer commits', async () => {
  const { session, readers } = setup();
  const request = session.read(file, 'byte', vi.fn());
  readers[0].complete();
  session.cancel();
  expect(await request.result).toBe('aGVsbG8=');
  expect(request.isCurrent()).toBe(false);
});

it('settles cancellation without depending on a browser abort event', async () => {
  const { session, readers } = setup();
  const request = session.read(file, 'byte', vi.fn());
  const settled = request.result.catch((error: DOMException) => error.name);
  session.cancel();
  session.cancel();
  expect(await settled).toBe('AbortError');
  expect(readers[0].abort).toHaveBeenCalledOnce();
  expect(session.pending).toBe(false);
  expect(readers[0].onprogress).toBeNull();
});

it('releases callbacks after a conversion error', async () => {
  const { session, readers } = setup();
  const request = session.read(file, 'byte', vi.fn());
  const settled = request.result.catch((error: Error) => error.message);
  readers[0].error = new DOMException('Unreadable', 'NotReadableError');
  readers[0].onerror!();
  expect(await settled).toBe('Unreadable');
  expect(session.pending).toBe(false);
  expect(readers[0].onload).toBeNull();
});

it('reads a batch in chooser order and reports aggregate progress', async () => {
  const { session, readers } = setup();
  const progress = vi.fn();
  const request = session.readBatch([file, file], 'byte', progress);
  readers[0].complete('data:text/plain;base64,Zmlyc3Q=');
  await Promise.resolve();
  expect(readers).toHaveLength(2);
  readers[1].onprogress!({
    loaded: 2,
    total: 5,
    lengthComputable: true,
  } as ProgressEvent<FileReader>);
  expect(progress).toHaveBeenLastCalledWith({ loaded: 7, total: 10, lengthComputable: true });
  readers[1].complete('data:text/plain;base64,c2Vjb25k');
  expect(await request.result).toEqual(['Zmlyc3Q=', 'c2Vjb25k']);
  expect(session.pending).toBe(false);
});

it('discards a batch when a later read fails and never reads remaining files', async () => {
  const { session, readers } = setup();
  const request = session.readBatch([file, file, file], 'byte', vi.fn());
  const settled = request.result.catch((error: Error) => error.message);
  readers[0].complete();
  await Promise.resolve();
  readers[1].error = new DOMException('Failed second file', 'NotReadableError');
  readers[1].onerror!();
  expect(await settled).toBe('Failed second file');
  expect(readers).toHaveLength(2);
  expect(session.pending).toBe(false);
});

it('invalidates a batch between files without starting another reader', async () => {
  const { session, readers } = setup();
  const request = session.readBatch([file, file], 'byte', vi.fn());
  const settled = request.result.catch((error: DOMException) => error.name);
  readers[0].complete();
  session.cancel();
  expect(await settled).toBe('AbortError');
  expect(readers).toHaveLength(1);
  expect(request.isCurrent()).toBe(false);
});
