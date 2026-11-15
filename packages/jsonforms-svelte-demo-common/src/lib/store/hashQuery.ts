/** Hash routes keep their own query after the example path. */
export function splitHashQuery(hash: string) {
  const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
  const separator = fragment.indexOf('?');
  return {
    route: separator < 0 ? fragment : fragment.slice(0, separator),
    params: new URLSearchParams(separator < 0 ? '' : fragment.slice(separator + 1)),
  };
}

/** Change the selected example without discarding its hash-query view settings. */
export function exampleHashHref(name: string, currentHash: string): string {
  const { params } = splitHashQuery(currentHash);
  const query = params.toString();
  return `#/examples/${encodeURIComponent(name)}${query ? `?${query}` : ''}`;
}

/** A value in the hash query wins over the ordinary URL query. */
export function readDemoQuery(url: URL, key: string): string | null {
  const { params } = splitHashQuery(url.hash);
  return params.has(key) ? params.get(key) : url.searchParams.get(key);
}

/** Write one supported setting beside the hash route, retaining other parameters. */
export function writeDemoQuery(url: URL, key: string, value: string | undefined): string {
  const next = new URL(url);
  const { route, params } = splitHashQuery(next.hash);
  next.searchParams.delete(key);
  if (value === undefined) params.delete(key);
  else params.set(key, value);
  next.hash = `${route}${params.size ? `?${params}` : ''}`;
  return `${next.pathname}${next.search}${next.hash}`;
}
