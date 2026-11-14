import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format } from 'vite-plus/fmt';

interface Manifest {
  repository: string;
  component: string;
  upstreamRevision: string;
  license: string;
  licenseCopyright: string;
  runtimeDependencies: string[];
}
interface GitHubEntry {
  name: string;
  type: string;
}

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = (name: string) => {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
};
const component = option('--component') ?? 'stepper';
if (!['stepper', 'tags-input'].includes(component))
  throw new Error('--component must be stepper or tags-input');
const manifestPath = resolve(
  repo,
  component === 'stepper'
    ? 'scripts/shadcn-extras-upstream.json'
    : 'scripts/shadcn-extras-tags-input-upstream.json',
);
const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Manifest;
const roots = [
  'packages/jsonforms-svelte-shadcn-webcomponent/src/lib/components/ui',
  'apps/jsonforms-svelte-shadcn-demo/src/lib/components/ui',
];
if (args.includes('--help')) {
  console.log(
    'shadcn-extras-sync.ts [--component stepper|tags-input] [--check] [--ref FULL_SHA] [--stage DIRECTORY] [--write]',
  );
  console.log('Default: read-only comparison of shadcn-svelte-extras Stepper in both UI copies.');
  process.exit(0);
}
for (let index = 0; index < args.length; index++) {
  if (args[index] === '--ref' || args[index] === '--stage' || args[index] === '--component') {
    if (!args[index + 1] || args[index + 1].startsWith('--'))
      throw new Error(`${args[index]} needs a value`);
    index++;
    continue;
  }
  if (!['--write', '--check'].includes(args[index]))
    throw new Error(`Unknown option: ${args[index]}`);
}
const stage = option('--stage');
const write = args.includes('--write');
if (write && args.includes('--check')) throw new Error('--check cannot be combined with --write');
if (write && (!stage || !option('--ref')))
  throw new Error('--write requires both --stage and an explicit immutable --ref');
if (
  stage &&
  roots.some((root) => {
    const componentRoot = resolve(repo, root);
    return resolve(stage) === componentRoot || resolve(stage).startsWith(componentRoot + sep);
  })
)
  throw new Error('Stage outside live component directories');
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
async function getText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'jsonforms-svelte-shadcn-extras-audit' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`${response.status} fetching ${url}`);
  return response.text();
}
async function getJson<T>(url: string): Promise<T> {
  return JSON.parse(await getText(url)) as T;
}
const revision =
  option('--ref') ??
  (
    await getJson<{ sha: string }>(
      `https://api.github.com/repos/${manifest.repository}/commits/main`,
    )
  ).sha;
if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('--ref must be a full commit SHA');

const source = `https://raw.githubusercontent.com/${manifest.repository}/${revision}`;
const directory = `src/lib/components/ui/${manifest.component}`;
const entries = await getJson<GitHubEntry[]>(
  `https://api.github.com/repos/${manifest.repository}/contents/${directory}?ref=${revision}`,
);
const names = entries
  .filter(({ type }) => type === 'file')
  .map(({ name }) => name)
  .sort();
if (
  entries.some(({ type }) => type !== 'file') ||
  !names.includes('index.ts') ||
  !names.includes(`${manifest.component}.svelte`) ||
  names.some((name) => !/^[a-z0-9.-]+\.(svelte|ts)$/.test(name))
)
  throw new Error(
    `Unexpected upstream ${manifest.component} file list; review the registry layout`,
  );

// Keep repository adaptations explicit. Refuse to apply them to changed upstream
// source until the new API and behavior have been reviewed.
function adapt(name: string, sourceText: string): string {
  let text = sourceText
    .replaceAll("from '$lib/utils.js'", "from '@jsonforms-svelte-shadcn-ui/utils.js'")
    .replaceAll("from '$lib/utils'", "from '@jsonforms-svelte-shadcn-ui/utils.js'");
  if (name === 'index.ts') {
    text =
      '// Adapted from shadcn-svelte-extras by Aidan Bleser (MIT).\n' +
      '// See ./LICENSE for the copyright and permission notice.\n' +
      text;
  }
  if (manifest.component === 'stepper' && name === 'stepper-item.svelte') {
    const importLine = "import type { StepperItemProps } from './types';";
    const registration = 'const stepperItemState = useStepperItem({ id });';
    if (!text.includes(importLine) || !text.includes(registration))
      throw new Error('Stepper item changed upstream; review the stable-ID adapter');
    text = text
      .replace(importLine, `${importLine}\n\timport { onDestroy, untrack } from 'svelte';`)
      .replace(
        registration,
        'const stepperItemState = useStepperItem({ id: untrack(() => id) });\n\tonDestroy(() => stepperItemState.destroy());',
      );
  }
  if (manifest.component === 'stepper' && name === 'stepper.svelte.ts') {
    const replaceRequired = (before: string, after: string) => {
      if (text.split(before).length !== 2)
        throw new Error(`Stepper registration changed upstream: ${before.slice(0, 45)}`);
      text = text.replace(before, after);
    };
    replaceRequired(
      '\tsteps: { id: string; triggerRef: () => HTMLButtonElement | null }[] = $state([]);',
      `\tsteps: { id: string; triggerRef: () => HTMLButtonElement | null }[] = $state([]);
\t// Conditional steps can mount later than their DOM neighbours. Keep navigation in visual order.
\torderedSteps = $derived.by(() =>
\t\t[...this.steps].sort((a, b) => {
\t\t\tconst left = a.triggerRef();
\t\t\tconst right = b.triggerRef();
\t\t\tif (!left?.isConnected || !right?.isConnected) return 0;
\t\t\treturn left.compareDocumentPosition(right) & 4 ? -1 : 1;
\t\t})
\t);`,
    );
    replaceRequired(
      `\tregisterStep(step: StepperItemState): number {
\t\treturn this.steps.push({ id: step.opts.id, triggerRef: () => step.getTriggerRef() });
\t}`,
      `\tregisterStep(step: StepperItemState): void {
\t\tthis.steps.push({ id: step.opts.id, triggerRef: () => step.getTriggerRef() });
\t}

\tunregisterStep(id: string): void {
\t\tthis.steps = this.steps.filter((step) => step.id !== id);
\t}`,
    );
    replaceRequired(
      'this.steps.length > this.opts.step.current',
      'this.orderedSteps.length > this.opts.step.current',
    );
    replaceRequired(
      'this.steps.findIndex((step) => step.id === stepId)',
      'this.orderedSteps.findIndex((step) => step.id === stepId)',
    );
    replaceRequired(
      'this.steps[this.opts.step.current]',
      'this.orderedSteps[this.opts.step.current]',
    );
    replaceRequired(
      'this.steps[this.opts.step.current - 2]',
      'this.orderedSteps[this.opts.step.current - 2]',
    );
    replaceRequired(
      'class StepperItemState {\n\tstep: number;',
      `class StepperItemState {
\tget step() {
\t\treturn this.rootState.orderedSteps.findIndex((step) => step.id === this.opts.id) + 1;
\t}`,
    );
    replaceRequired(
      '\t\tthis.step = this.rootState.registerStep(this);\n\t}',
      `\t\tthis.rootState.registerStep(this);
\t}

\tdestroy() {
\t\tthis.rootState.unregisterStep(this.opts.id);
\t}`,
    );
    replaceRequired(
      'this.step === this.rootState.steps.length',
      'this.step === this.rootState.orderedSteps.length',
    );
  }
  if (manifest.component === 'tags-input') {
    if (name === 'types.ts') {
      const anchor = '\tvalue?: string[];';
      if (!text.includes(anchor)) throw new Error('Tags Input props changed upstream');
      text = text.replace(anchor, `${anchor}\n\tremoveLabel?: (value: string) => string;`);
    }
    if (name === 'tags-input.svelte') {
      const prop = '\t\tonValueChange,';
      const tag =
        '<TagsInputTag value={tag} {disabled} onDelete={deleteValue} active={i === tagIndex} />';
      if (!text.includes(prop) || !text.includes(tag))
        throw new Error('Tags Input tag rendering changed upstream');
      text = text
        .replace(prop, `${prop}\n\t\tremoveLabel,`)
        .replace(
          tag,
          '<TagsInputTag value={tag} {disabled} onDelete={deleteValue} active={i === tagIndex} {removeLabel} />',
        );
    }
    if (name === 'tags-input-tag.svelte') {
      const prop = '\t\tonDelete: (value: string) => void;';
      const destructure = 'let { value, disabled, onDelete, active }: Props = $props();';
      const button = '<button type="button" {disabled} onclick={() => onDelete(value)}>';
      if (!text.includes(prop) || !text.includes(destructure) || !text.includes(button))
        throw new Error('Tags Input delete button changed upstream');
      text = text
        .replace(prop, `${prop}\n\t\tremoveLabel?: (value: string) => string;`)
        .replace(
          destructure,
          'let { value, disabled, onDelete, active, removeLabel }: Props = $props();',
        )
        .replace(
          button,
          '<button type="button" {disabled} aria-label={removeLabel?.(value) ?? `Remove ${value}`} onclick={() => onDelete(value)}>',
        );
    }
  }
  return text;
}
async function normalized(name: string, content: string): Promise<string> {
  const result = await format(name, content, {
    svelte: true,
    singleQuote: true,
    useTabs: true,
    tabWidth: 4,
    printWidth: 100,
  });
  if (result.errors.length) throw new Error(result.errors.map((error) => error.message).join('\n'));
  return result.code;
}
const upstream = new Map<string, string>();
const generated = new Map<string, string>();
for (const name of names) {
  const raw = await getText(`${source}/${directory}/${name}`);
  upstream.set(name, raw);
  generated.set(name, await normalized(name, adapt(name, raw)));
}
const licenseText = await getText(`${source}/LICENSE`);
if (!licenseText.includes(manifest.licenseCopyright) || !licenseText.startsWith('MIT License'))
  throw new Error('Upstream license changed; review before syncing');
generated.set('LICENSE', licenseText);
upstream.set('LICENSE', licenseText);

const files = [];
for (const [name, text] of generated) {
  const copies = [];
  for (const root of roots) {
    const file = resolve(repo, root, manifest.component, name);
    let local: string | undefined;
    try {
      local = await readFile(file, 'utf8');
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
    }
    const localText =
      local === undefined ? undefined : name === 'LICENSE' ? local : await normalized(name, local);
    copies.push({
      root,
      status: localText === undefined ? 'missing' : localText === text ? 'matching' : 'different',
      localSha256: localText === undefined ? null : hash(localText),
    });
  }
  files.push({
    name,
    upstreamSha256: hash(upstream.get(name)!),
    adaptedSha256: hash(text),
    copies,
  });
}
const extraFiles = [];
for (const root of roots) {
  const localNames = await readdir(resolve(repo, root, manifest.component)).catch(
    (error: unknown) => {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return [];
      throw error;
    },
  );
  // Web Component builds emit declarations beside copied source files.
  for (const name of localNames)
    if (!name.endsWith('.d.ts') && !generated.has(name)) extraFiles.push({ root, name });
}
const changed = files.filter((file) => file.copies.some((copy) => copy.status !== 'matching'));
const report = {
  upstreamRepository: manifest.repository,
  upstreamRevision: revision,
  adoptedRevision: manifest.upstreamRevision,
  sourceDirectory: directory,
  checkedAt: new Date().toISOString(),
  runtimeDependencies: manifest.runtimeDependencies,
  localAdapters: [
    'Replace $lib/utils imports with the renderer UI alias.',
    'Preserve the attribution comment and LICENSE.',
    ...(manifest.component === 'stepper'
      ? [
          'Snapshot the Stepper item ID when registering it to avoid a Svelte reactive-state warning.',
          'Remove destroyed steps and order conditional steps by their DOM triggers.',
        ]
      : ['Pass a localized accessible label to each tag removal button.']),
  ],
  roots,
  files,
  extraFiles,
};
if (stage) {
  const output = resolve(stage);
  await mkdir(output, { recursive: true });
  await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  for (const [name, text] of generated) {
    const upstreamTarget = resolve(output, 'upstream', manifest.component, name);
    await mkdir(dirname(upstreamTarget), { recursive: true });
    await writeFile(upstreamTarget, upstream.get(name)!);
    const target = resolve(output, 'ui', manifest.component, name);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, text);
  }
}
if (write) {
  for (const root of roots)
    for (const [name, text] of generated) {
      const target = resolve(repo, root, manifest.component, name);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, text);
    }
  await writeFile(
    manifestPath,
    JSON.stringify({ ...manifest, upstreamRevision: revision }, null, 2) + '\n',
  );
}
console.log(
  `shadcn-svelte-extras ${revision}: ${files.length} ${manifest.component} files across ${roots.length} copies; ${changed.length} differ, ${extraFiles.length} extra.`,
);
if (stage) console.log(`Snapshot and report: ${resolve(stage)}`);
if (write)
  console.log(
    `Updated both ${manifest.component} copies and the adopted revision; review source and dependencies.`,
  );
if (args.includes('--check') && (changed.length || extraFiles.length)) process.exitCode = 1;
