import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../apps', import.meta.url));

/** Fail before browser interaction when a demo still embeds an older WC build. */
export function assertCurrentDemoWebComponent(family: string) {
  const entry = `jsonforms-svelte-${family}.js`;
  const source = path.join(
    root,
    '..',
    'packages',
    `jsonforms-svelte-${family}-webcomponent`,
    'dist',
    entry,
  );
  const embedded = path.join(root, `jsonforms-svelte-${family}-demo`, 'build', 'js', entry);
  if (!readFileSync(source).equals(readFileSync(embedded))) {
    throw new Error(
      `${family} demo contains a stale web-component bundle. Build web components before demos, or refresh the demo's build/js copy from the package dist directory.`,
    );
  }
}

export function createDemoServer() {
  const types: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
  };
  return createServer((request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const [family, ...segments] = decodeURIComponent(url.pathname).slice(1).split('/');
      if (!['flowbite', 'shadcn', 'skeleton'].includes(family)) throw new Error('Unknown demo');
      const directory = path.join(root, `jsonforms-svelte-${family}-demo`, 'build');
      const file = path.resolve(directory, segments.join('/') || 'index.html');
      if (!file.startsWith(directory + path.sep)) throw new Error('Invalid path');
      response.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream');
      response.end(readFileSync(file));
    } catch {
      response.writeHead(404);
      response.end();
    }
  });
}
