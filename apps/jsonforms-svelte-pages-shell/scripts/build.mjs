import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = path.resolve(appDir, '..', '..');
const outputDir = path.join(appDir, 'build');
const selectorPagePath = path.join(appDir, 'src', 'index.html');

const demos = [
  {
    name: 'flowbite',
    sourceDir: path.join(repoDir, 'apps', 'jsonforms-svelte-flowbite-demo', 'build'),
  },
  {
    name: 'skeleton',
    sourceDir: path.join(repoDir, 'apps', 'jsonforms-svelte-skeleton-demo', 'build'),
  },
];

const ensureExists = async (targetPath, label) => {
  try {
    await access(targetPath);
  } catch {
    throw new Error(
      `${label} not found at ${targetPath}. Run "pnpm run build:demo" before building jsonforms-svelte-pages-shell.`
    );
  }
};

const normalizeIndexHtml = async (indexHtmlPath) => {
  const html = await readFile(indexHtmlPath, 'utf8');
  const normalized = html
    .replace(/(href|src)=["']\/(?!\/)/g, '$1="./')
    .replace(/import\(["']\/(?!\/)/g, 'import("./');
  await writeFile(indexHtmlPath, normalized, 'utf8');
};

const build = async () => {
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  await ensureExists(selectorPagePath, 'Shell index template');
  const selectorPage = await readFile(selectorPagePath, 'utf8');
  await writeFile(path.join(outputDir, 'index.html'), selectorPage, 'utf8');

  for (const demo of demos) {
    await ensureExists(demo.sourceDir, `${demo.name} demo build output`);
    const targetDir = path.join(outputDir, demo.name);
    await cp(demo.sourceDir, targetDir, { recursive: true });
    await normalizeIndexHtml(path.join(targetDir, 'index.html'));
  }
};

await build();
