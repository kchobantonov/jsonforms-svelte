import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';

export function createPackedConsumer(name) {
  const consumer = mkdtempSync(path.join(tmpdir(), `jsonforms-packed-${name}-`));
  const run = (command, args) => execFileSync(command, args, { cwd: consumer, stdio: 'inherit' });
  const write = (file, content) => {
    const destination = path.join(consumer, file);
    mkdirSync(path.dirname(destination), { recursive: true });
    writeFileSync(destination, content);
  };
  async function buildAndServe() {
    run(process.execPath, ['node_modules/vite/dist/vite/node/cli.js', 'build']);
    return serveConsumer(path.join(consumer, 'dist'));
  }
  return { consumer, run, write, buildAndServe };
}

async function serveConsumer(dist) {
  const server = createServer((request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
    const file = path.resolve(dist, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(dist + path.sep)) {
      response.writeHead(404).end();
      return;
    }
    try {
      response.setHeader(
        'Content-Type',
        file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html',
      );
      response.end(readFileSync(file));
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  return { server, url: `http://127.0.0.1:${address.port}/` };
}
