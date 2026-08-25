import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const packageRoot = path.resolve(import.meta.dirname, '..');
const sourceRoot = path.join(packageRoot, 'src/lib');
const uiImportPattern = /@jsonforms-svelte-shadcn-ui\/([a-z0-9-]+)/g;

const requiredComponents = [
  'accordion',
  'avatar',
  'breadcrumb',
  'button',
  'calendar',
  'card',
  'checkbox',
  'collapsible',
  'dialog',
  'field',
  'input',
  'item',
  'label',
  'native-select',
  'popover',
  'radio-group',
  'select',
  'slider',
  'switch',
  'table',
  'tabs',
  'textarea',
  'toggle-group',
  'tooltip',
] as const;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(entryPath) : [entryPath];
  });
}

describe('app-owned Shadcn UI contract', () => {
  it('keeps the documented component list synchronized with renderer imports', () => {
    const importedComponents = new Set<string>();

    for (const file of sourceFiles(sourceRoot)) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(uiImportPattern)) importedComponents.add(match[1]);
    }

    expect([...importedComponents].sort()).toEqual([...requiredComponents].sort());

    const readme = readFileSync(path.join(packageRoot, 'README.md'), 'utf8');
    expect(readme).toContain(`add ${requiredComponents.join(' ')}`);
  });

  it('does not publish generated UI components from the renderer source', () => {
    const componentEntries = readdirSync(path.join(sourceRoot, 'components'));
    const componentIndex = readFileSync(path.join(sourceRoot, 'components/index.ts'), 'utf8');

    expect(componentEntries).not.toContain('ui');
    expect(componentIndex).not.toContain("export * from './ui'");
  });
});
