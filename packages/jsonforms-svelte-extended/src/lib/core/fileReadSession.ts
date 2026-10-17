export interface FileReadRequest<T = string> {
  result: Promise<T>;
  isCurrent: () => boolean;
}
export type FileReadProgress = Pick<
  ProgressEvent<FileReader>,
  'loaded' | 'total' | 'lengthComputable'
>;

/** One selection owns its reads until replaced, cancelled or disposed.
 * Check currency after awaiting result: a load event can resolve just before
 * another selection or host update invalidates the request.
 */
export function createFileReadSession(createReader: () => FileReader = () => new FileReader()) {
  let generation = 0;
  let pendingToken: number | undefined;
  let active:
    | { reader: FileReader; reject: (error: unknown) => void; detach: () => void }
    | undefined;
  const abortError = () => new DOMException('Aborted', 'AbortError');
  const cancel = () => {
    generation += 1;
    pendingToken = undefined;
    const previous = active;
    active = undefined;
    if (!previous) return;
    previous.detach();
    previous.reject(abortError());
    if (previous.reader.readyState === 1) previous.reader.abort();
  };
  const readOne = (
    file: File,
    format: string | undefined,
    onProgress: (event: ProgressEvent<FileReader>) => void,
    token: number,
  ): Promise<string> => {
    const reader = createReader();
    const isActive = () => generation === token && active?.reader === reader;
    return new Promise<string>((resolve, reject) => {
      const detach = () => {
        reader.onload = null;
        reader.onerror = null;
        reader.onabort = null;
        reader.onprogress = null;
      };
      const finish = () => {
        detach();
        if (isActive()) active = undefined;
      };
      active = { reader, reject, detach };
      reader.onload = () => {
        if (!isActive()) return;
        const dataUrl = String(reader.result ?? '');
        finish();
        if (format === 'uri') resolve(dataUrl);
        else if (format === 'binary') {
          const marker = dataUrl.indexOf(';base64,');
          resolve(
            marker < 0
              ? dataUrl
              : `${dataUrl.slice(0, marker)};filename=${encodeURIComponent(file.name)}${dataUrl.slice(marker)}`,
          );
        } else resolve(dataUrl.slice(dataUrl.indexOf(',') + 1));
      };
      reader.onerror = () => {
        if (!isActive()) return;
        finish();
        reject(reader.error ?? new Error('Failed to read file'));
      };
      reader.onabort = () => {
        if (!isActive()) return;
        finish();
        reject(abortError());
      };
      reader.onprogress = (event) => {
        if (isActive()) onProgress(event);
      };
      try {
        reader.readAsDataURL(file);
      } catch (error) {
        finish();
        reject(error);
      }
    });
  };
  const start = <T>(operation: (token: number) => Promise<T>): FileReadRequest<T> => {
    cancel();
    const token = generation;
    pendingToken = token;
    const isCurrent = () => generation === token;
    // Start immediately so callers can cancel even before the first microtask.
    let result: Promise<T>;
    try {
      result = operation(token);
    } catch (error) {
      result = Promise.reject(error);
    }
    return {
      isCurrent,
      result: result.finally(() => {
        if (isCurrent()) pendingToken = undefined;
      }),
    };
  };
  return {
    cancel,
    get pending() {
      return pendingToken !== undefined;
    },
    read(
      file: File,
      format: string | undefined,
      onProgress: (event: ProgressEvent<FileReader>) => void,
    ): FileReadRequest {
      return start((token) => readOne(file, format, onProgress, token));
    },
    /** Read sequentially in chooser order, exposing a result only for a complete
     * batch. A failure/cancellation prevents later files from being read.
     */
    readBatch(
      files: readonly File[],
      format: string | undefined,
      onProgress: (progress: FileReadProgress) => void,
    ): FileReadRequest<string[]> {
      return start(async (token) => {
        const results: string[] = [];
        const total = files.reduce((sum, file) => sum + file.size, 0);
        let completed = 0;
        for (const file of files) {
          if (generation !== token) throw abortError();
          const value = await readOne(
            file,
            format,
            (event) =>
              onProgress({
                loaded:
                  completed +
                  (event.total > 0 ? file.size * Math.min(1, event.loaded / event.total) : 0),
                total,
                lengthComputable: event.lengthComputable,
              }),
            token,
          );
          if (generation !== token) throw abortError();
          results.push(value);
          completed += file.size;
        }
        return results;
      });
    },
  };
}
