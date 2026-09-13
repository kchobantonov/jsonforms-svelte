import { access, cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = path.resolve(appDir, '..', '..');
const outputDir = path.join(appDir, 'build');
const selectorPagePath = path.join(appDir, 'src', 'index.html');

const editorDir = path.resolve(process.env.JSONFORMS_EDITOR_DEMO_DIST ??
  path.join(repoDir, '..', 'jsonforms-editor', 'apps', 'jsonforms-svelte-editor-demo', 'dist'));
let includeEditor = false;
try {
  await access(path.join(editorDir, 'index.html'));
  includeEditor = true;
} catch (error) {
  if (process.env.JSONFORMS_EDITOR_DEMO_DIST) throw error;
}

const demos = [
  ...(includeEditor ? [{ name: 'editor', sourceDir: editorDir }] : []),
  {
    name: 'flowbite',
    sourceDir: path.join(repoDir, 'apps', 'jsonforms-svelte-flowbite-demo', 'build'),
  },
  {
    name: 'skeleton',
    sourceDir: path.join(repoDir, 'apps', 'jsonforms-svelte-skeleton-demo', 'build'),
  },
  {
    name: 'shadcn',
    sourceDir: path.join(repoDir, 'apps', 'jsonforms-svelte-shadcn-demo', 'build'),
  },
];

const ensureExists = async (targetPath, label) => {
  try {
    await access(targetPath);
  } catch {
    throw new Error(
      `${label} not found at ${targetPath}. Run "pnpm run build:pages" to build the demos and shell together.`,
    );
  }
};

const build = async () => {
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  await ensureExists(selectorPagePath, 'Shell index template');
  const template = await readFile(selectorPagePath, 'utf8');
  await writeFile(path.join(outputDir, 'index.html'), includeEditor ? template :
    template.replace('        <a href="./editor/">Open Form Editor Demo</a>\n', ''));

  for (const demo of demos) {
    await ensureExists(demo.sourceDir, `${demo.name} demo build output`);
    const targetDir = path.join(outputDir, demo.name);
    await cp(demo.sourceDir, targetDir, { recursive: true });
  }
};

await build();
