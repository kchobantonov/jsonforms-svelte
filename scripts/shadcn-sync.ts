import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { resolve, dirname, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { format } from "prettier";
import * as sveltePlugin from "prettier-plugin-svelte";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const roots = [
  "packages/jsonforms-svelte-shadcn-webcomponent/src/lib/components/ui",
  "packages/jsonforms-svelte-editor-webcomponent/src/components/ui",
  "apps/jsonforms-svelte-shadcn-demo/src/lib/components/ui",
];
const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log(
    "shadcn-sync.ts [--check] [--style nova] [--ref FULL_SHA] [--stage DIRECTORY] [--write]",
  );
  console.log(
    "Default: read-only comparison. --write updates generated component files in all three roots; it requires --stage. Dependencies and CSS are reported, not installed.",
  );
  process.exit(0);
}
const valueOptions = new Set(["--style", "--ref", "--stage"]);
for (let index = 0; index < args.length; index++) {
  if (valueOptions.has(args[index])) {
    index++;
    continue;
  }
  if (!["--write", "--check"].includes(args[index]))
    throw new Error(`Unknown option: ${args[index]}`);
}
if (args.includes("--write") && args.includes("--check"))
  throw new Error("--check is read-only; do not combine it with --write.");
const option = (name: string) => {
  const index = args.indexOf(name);
  if (index < 0) return undefined;
  if (!args[index + 1] || args[index + 1].startsWith("--"))
    throw new Error(`${name} needs a value`);
  return args[index + 1];
};
const style = option("--style") ?? "nova";
if (
  !["vega", "nova", "maia", "lyra", "mira", "luma", "sera", "rhea"].includes(
    style,
  )
)
  throw new Error("Unknown registry style");
const stage = option("--stage");
const write = args.includes("--write");
if (write && !stage)
  throw new Error(
    "--write requires --stage so the upstream snapshot is retained for review.",
  );
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
async function json(url: string): Promise<any> {
  const response = await fetch(url, {
    headers: { "User-Agent": "jsonforms-svelte-shadcn-audit" },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`${response.status} fetching ${url}`);
  return response.json();
}
// Pin every request to a single immutable revision, even if main changes mid-run.
const revision =
  option("--ref") ??
  (
    await json(
      "https://api.github.com/repos/huntabyte/shadcn-svelte/commits/main",
    )
  ).sha;
if (!/^[a-f0-9]{40}$/.test(revision))
  throw new Error("--ref must be a full upstream commit SHA");
const cli = await json("https://registry.npmjs.org/shadcn-svelte/latest");
const componentNames = [
  ...new Set(
    (
      await Promise.all(
        roots.map(async (root) =>
          (await readdir(resolve(repo, root), { withFileTypes: true }))
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name),
        ),
      )
    ).flat(),
  ),
].sort();
const alias = "@jsonforms-svelte-shadcn-ui";
function imports(content: string, target: string) {
  return content
    .replaceAll("$UTILS$", `${alias}/utils`)
    .replaceAll("$UI$", alias)
    .replace(/(['"])(\.\.?\/[^'"]+)\1/g, (match, quote, path) => {
      const resolved = posix.normalize(posix.join(posix.dirname(target), path));
      return resolved === "utils.js" || resolved === "utils"
        ? `${quote}${alias}/utils.js${quote}`
        : match;
    });
}
async function normalized(content: string, target: string) {
  return format(imports(content, target), {
    parser: target.endsWith(".svelte") ? "svelte" : "typescript",
    plugins: [sveltePlugin],
    singleQuote: true,
    useTabs: false,
    tabWidth: 2,
    printWidth: 100,
  });
}
const snapshots: any[] = [];
// Limit request concurrency; no writes occur until the complete registry fetch succeeds.
for (let index = 0; index < componentNames.length; index += 4) {
  snapshots.push(
    ...(await Promise.all(
      componentNames.slice(index, index + 4).map(async (name) => {
        const url = `https://raw.githubusercontent.com/huntabyte/shadcn-svelte/${revision}/docs/static/registry/styles/${style}/${name}.json`;
        const registry = await json(url);
        if (
          registry.name !== name ||
          !Array.isArray(registry.files) ||
          !registry.files.length
        ) {
          throw new Error(`Invalid registry entry for ${name}`);
        }
        return { name, url, registry };
      }),
    )),
  );
}
const generated = new Map<string, string>();
const components: any[] = [];
for (const { name, url, registry } of snapshots) {
  const files: any[] = [];
  for (const file of registry.files ?? []) {
    const target = file.target;
    if (
      typeof target !== "string" ||
      !target.startsWith(`${name}/`) ||
      target.includes("..") ||
      typeof file.content !== "string"
    )
      throw new Error(
        `Unexpected registry file in ${name}; review its target before syncing`,
      );
    const text = await normalized(file.content, target);
    if (/\$[A-Z_]+\$/.test(text))
      throw new Error(`Unresolved registry placeholder in ${target}`);
    generated.set(target, text);
    const copies: any[] = [];
    for (const root of roots) {
      let local: string | undefined;
      try {
        local = await readFile(resolve(repo, root, target), "utf8");
      } catch (error: any) {
        if (error.code !== "ENOENT") throw error;
      }
      const localNormalized =
        local === undefined ? undefined : await normalized(local, target);
      copies.push({
        root,
        status:
          local === undefined
            ? "missing"
            : localNormalized === text
              ? "matching"
              : "different",
        localSha256:
          localNormalized === undefined ? null : hash(localNormalized),
      });
    }
    files.push({ target, upstreamSha256: hash(text), copies });
  }
  components.push({
    name,
    url,
    dependencies: registry.dependencies ?? [],
    devDependencies: registry.devDependencies ?? [],
    registryDependencies: registry.registryDependencies ?? [],
    files,
  });
}
const extraFiles: { root: string; target: string }[] = [];
for (const root of roots)
  for (const component of componentNames) {
    let entries;
    try {
      entries = await readdir(resolve(repo, root, component), {
        recursive: true,
        withFileTypes: true,
      });
    } catch (error: any) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    for (const entry of entries)
      if (entry.isFile()) {
        const target = posix.join(
          component,
          posix.relative(
            resolve(repo, root, component),
            resolve(entry.parentPath, entry.name),
          ),
        );
        if (!generated.has(target)) extraFiles.push({ root, target });
      }
  }
const report = {
  extraFiles,
  checkedAt: new Date().toISOString(),
  upstreamRevision: revision,
  style,
  latestCli: cli.version,
  roots,
  exclusions: [
    "Top-level ui/index.ts and ui/utils.ts are repository-owned and are not overwritten.",
    "Differences include local adaptations and source ordering; they are not necessarily runtime defects.",
    "Theme CSS, dependency versions and registry dependency additions require review before adoption.",
  ],
  components,
};
if (stage) {
  const output = resolve(stage);
  if (roots.some((root) => output.startsWith(resolve(repo, root))))
    throw new Error("Stage outside live component directories");
  await mkdir(output, { recursive: true });
  await writeFile(
    resolve(output, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  for (const snapshot of snapshots) {
    await mkdir(resolve(output, "registry"), { recursive: true });
    await writeFile(
      resolve(output, "registry", snapshot.name + ".json"),
      JSON.stringify(snapshot.registry, null, 2) + "\n",
    );
  }
  for (const [target, text] of generated) {
    const file = resolve(output, "ui", target);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, text);
  }
}
if (write) {
  for (const root of roots)
    for (const [target, text] of generated) {
      const file = resolve(repo, root, target);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, text);
    }
}
const differing = components.filter((component) =>
  component.files.some((file: any) =>
    file.copies.some((copy: any) => copy.status !== "matching"),
  ),
);
console.log(`Upstream ${revision}; style ${style}; CLI ${cli.version}`);
console.log(
  `${components.length} installed components audited across ${roots.length} copies; ${differing.length} differ from the generated upstream source.`,
);
console.log(differing.map((component) => component.name).join(", "));
if (stage) console.log(`Snapshot and detailed report: ${resolve(stage)}`);
if (write)
  console.log(
    "Updated generated files in all three copies. Review dependencies, theme CSS and removed upstream files before committing.",
  );
if (extraFiles.length)
  console.log(
    `${extraFiles.length} local files are absent upstream and require review (never auto-deleted).`,
  );
if (args.includes("--check") && (differing.length || extraFiles.length))
  process.exitCode = 1;
