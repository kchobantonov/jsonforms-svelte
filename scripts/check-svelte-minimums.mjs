import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// This checks compiler compatibility, not a browser/runtime minimum-version matrix.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const floors = {
  'jsonforms-svelte': '5.20.0',
  'jsonforms-svelte-demo-common': '5.20.0',
  'jsonforms-svelte-extended': '5.20.0',
  'jsonforms-svelte-flowbite': '5.40.0',
  'jsonforms-svelte-flowbite-extended': '5.40.0',
  'jsonforms-svelte-shadcn': '5.33.0',
  'jsonforms-svelte-shadcn-extended': '5.33.0',
  'jsonforms-svelte-skeleton': '5.29.0',
  'jsonforms-svelte-skeleton-extended': '5.29.0',
};
const alias = (version) => `svelte-${version.split('.').slice(0, 2).join('-')}`;
const directoryIndex = process.argv.indexOf('--compiler-dir');
const supplied = directoryIndex >= 0;
const directory = supplied
  ? path.resolve(process.argv[directoryIndex + 1])
  : mkdtempSync(path.join(tmpdir(), 'jsonforms-svelte-minimums-'));
const files = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file) : /\.svelte(\.ts)?$/.test(entry.name) ? [file] : [];
  });
try {
  if (!supplied) {
    writeFileSync(
      path.join(directory, 'package.json'),
      JSON.stringify({
        private: true,
        dependencies: Object.fromEntries(
          [...new Set(Object.values(floors))].map((version) => [
            alias(version),
            `npm:svelte@${version}`,
          ]),
        ),
      }),
    );
    execFileSync('pnpm', ['install', '--ignore-scripts', '--no-frozen-lockfile'], {
      cwd: directory,
      stdio: 'inherit',
    });
  }
  const require = createRequire(path.join(directory, 'package.json'));
  for (const [name, version] of Object.entries(floors)) {
    const packageRoot = path.join(root, 'packages', name);
    const manifest = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
    assert.equal(
      manifest.peerDependencies.svelte,
      `^${version}`,
      `${name}: advertised minimum drift`,
    );
    const compiler = require(`${alias(version)}/compiler`);
    assert.equal(compiler.VERSION, version);
    const sources = files(path.join(packageRoot, 'src/lib'));
    for (const filename of sources) {
      const source = readFileSync(filename, 'utf8');
      for (const generate of ['client', 'server']) {
        if (filename.endsWith('.svelte.ts')) {
          const javascript = ts.transpileModule(source, {
            compilerOptions: {
              target: ts.ScriptTarget.ESNext,
              module: ts.ModuleKind.ESNext,
              verbatimModuleSyntax: true,
            },
          }).outputText;
          compiler.compileModule(javascript, { filename, generate });
        } else compiler.compile(source, { filename, generate });
      }
    }
    console.log(
      `${name}: ${sources.length} source files compile for client and server with Svelte ${version}`,
    );
  }
} finally {
  if (!supplied) rmSync(directory, { recursive: true, force: true });
}
