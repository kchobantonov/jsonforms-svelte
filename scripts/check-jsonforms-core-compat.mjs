import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagesRoot = path.join(root, 'packages');
const workspace = readFileSync(path.join(root, 'pnpm-workspace.yaml'), 'utf8');
const lock = readFileSync(path.join(root, 'pnpm-lock.yaml'), 'utf8');
const catalogRange = workspace.match(/^ {2}'@jsonforms\/core': '([^']+)'$/m)?.[1];
const locked = lock.match(
  /^ {4}'@jsonforms\/core':\n {6}specifier: ([^\n]+)\n {6}version: ([^\n]+)/m,
);
assert.ok(catalogRange && locked, 'JSON Forms core must be catalogued and locked');
assert.equal(locked[1], catalogRange, 'lockfile catalog range differs from the workspace');
const version = locked[2];
assert.ok(
  lock.includes(`  '@jsonforms/core@${version}':`),
  'installed version needs a lock snapshot',
);

function* sourceFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(file);
    else if (/\.(?:ts|tsx|svelte)$/.test(entry.name)) yield file;
  }
}

function importsFrom(file) {
  const content = readFileSync(file, 'utf8');
  const scripts = file.endsWith('.svelte')
    ? [...content.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((match) => match[1])
    : [content];
  const names = [];
  for (const script of scripts) {
    const source = ts.createSourceFile(
      file,
      script,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    for (const statement of source.statements) {
      if (
        !ts.isImportDeclaration(statement) ||
        statement.moduleSpecifier.text !== '@jsonforms/core'
      )
        continue;
      const clause = statement.importClause;
      if (!clause || clause.isTypeOnly) continue;
      if (clause.name) names.push('default');
      if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
        for (const specifier of clause.namedBindings.elements)
          if (!specifier.isTypeOnly)
            names.push(specifier.propertyName?.text ?? specifier.name.text);
      }
    }
  }
  return names;
}

let checkedPackages = 0;
const runtimeImports = new Set();
for (const entry of readdirSync(packagesRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || !entry.name.startsWith('jsonforms-svelte')) continue;
  const directory = path.join(packagesRoot, entry.name);
  const manifest = JSON.parse(readFileSync(path.join(directory, 'package.json'), 'utf8'));
  const declarations = ['dependencies', 'peerDependencies', 'devDependencies']
    .map((section) => manifest[section]?.['@jsonforms/core'])
    .filter(Boolean);
  assert.ok(declarations.length, `${entry.name} must declare @jsonforms/core`);
  assert.ok(
    declarations.every((declaration) => declaration === 'catalog:'),
    `${entry.name} must use the shared catalog for @jsonforms/core`,
  );
  const requireFromPackage = createRequire(pathToFileURL(path.join(directory, 'package.json')));
  const installed = requireFromPackage('@jsonforms/core/package.json');
  assert.equal(installed.version, version, `${entry.name} resolves a different JSON Forms core`);
  const core = requireFromPackage('@jsonforms/core');
  for (const file of sourceFiles(path.join(directory, 'src'))) {
    for (const name of importsFrom(file)) {
      assert.ok(
        name in core,
        `${entry.name}: ${path.relative(directory, file)} imports missing ${name}`,
      );
      runtimeImports.add(name);
    }
  }
  checkedPackages++;
}
console.log(
  `JSON Forms core ${version}: ${checkedPackages} Svelte packages and ${runtimeImports.size} distinct runtime imports resolve.`,
);
